const axios = require('axios');

const getCalculator = (req, res) => {
    const isLoggedIn = req.session.userId ? true : false;
    res.render('Calculator', {
        title: 'Nutrition Calculator',
        isLoggedIn
    });
};

const analyzeIngredients = async (req, res) => {
    const apiKey = "ec2038346da449b89a58e0be5dee7ec3";
    const { ingredientList } = req.body;

    if (!ingredientList) {
        return res.status(400).json({ error: "Please enter ingredients." });
    }

    try {
        const parseRes = await axios.post(
            `https://api.spoonacular.com/recipes/parseIngredients`,
            null,
            {
                params: {
                    apiKey,
                    ingredientList,
                    servings: 1
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const parsedData = parseRes.data;
        if (!Array.isArray(parsedData) || parsedData.length === 0) {
            console.log("🚫 No ingredients parsed");
            return res.status(404).json({ error: "No ingredients found." });
        }

        let allNutrients = [];

        for (const item of parsedData) {
            const id = item.id;
            if (!id) continue;

            const infoRes = await axios.get(`https://api.spoonacular.com/food/ingredients/${id}/information`, {
                params: {
                    apiKey,
                    amount: item.amount,
                    unit: item.unit
                }
            });

            const nutrients = infoRes.data.nutrition?.nutrients || [];
            allNutrients.push(...nutrients);
        }

        if (allNutrients.length === 0) {
            return res.status(404).json({ error: "No valid nutrients found for the provided ingredients. <br>"+
                "Please check for typos, use simple ingredient names (e.g., '2 eggs', '1 cup milk'), " +
               "and avoid using symbols or overly generic terms." });
        }

        // Merge nutrients
        const nutrientMap = {};
        allNutrients.forEach(n => {
            const name = n.name;
            if (!nutrientMap[name]) {
                nutrientMap[name] = {
                    amount: n.amount,
                    unit: n.unit,
                    percent: n.percentOfDailyNeeds
                };
            } else {
                nutrientMap[name].amount += n.amount;
                nutrientMap[name].percent += n.percentOfDailyNeeds;
            }
        });

        return res.json({
            ingredientList,
            nutrientMap
        });

    } catch (error) {
        console.error('Nutrition API Error:', error.message);
        return res.status(500).json({ error: "Failed to analyze nutrition." });
    }
};

module.exports = { getCalculator, analyzeIngredients };
