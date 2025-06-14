const getMealSuggestion = (req, res) => {
    const isLoggedIn = req.session.userId ? true : false;

    res.render('MealSuggestion', {
        title: 'Meal Suggestion',
        isLoggedIn
    });
};

module.exports = { getMealSuggestion };
