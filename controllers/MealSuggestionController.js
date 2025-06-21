const axios = require('axios');

const getMealSuggestion = (req, res) => {
  const isLoggedIn = req.session.userId ? true : false;
  res.render('MealSuggestion', {
    title: 'Meal Suggestion',
    isLoggedIn
  });
};

const searchMeals = async (req, res) => {
  const { query, goal } = req.query;
  const apiKey = "ec2038346da449b89a58e0be5dee7ec3";

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  // Build params object dynamically
  // returns 10 popular meals with nutrition data
  const params = {
    query,
    number: 10,
    addRecipeNutrition: true,
    sort: 'popularity',
    sortDirection: 'desc',
    apiKey
  };

  if (goal === "weight-loss") {
    params.maxCalories = 400;
    params.minProtein = 10;
  } else if (goal === "muscle-gain") {
    params.minProtein = 25;
    params.minCalories = 400;
  } else if (goal === "maintenance") {
    params.minCalories = 400;
    params.maxCalories = 600;
  }

  try {
    const searchRes = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
      params
    });

    const meals = searchRes.data.results || [];

    const detailedMeals = await Promise.all(
      meals.map(async (meal) => {
        const infoRes = await axios.get(
          `https://api.spoonacular.com/recipes/${meal.id}/information`,
          {
            params: {
              includeNutrition: true,
              apiKey
            }
          }
        );
        return infoRes.data;
      })
    );

    res.json(detailedMeals);
  } catch (err) {
    console.error('Error fetching meals:', err.message);
    res.status(500).json({ error: 'Failed to fetch meal data' });
  }
};

module.exports = { getMealSuggestion, searchMeals };
