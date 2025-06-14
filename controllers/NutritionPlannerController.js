const getNutritionPlanner = (req, res) => {
    const isLoggedIn = req.session.userId? true:false;

    res.render('NutritionPlanner',{
        title: 'Nutrition Planner',
        isLoggedIn
    }); 
};

module.exports = { getNutritionPlanner };
