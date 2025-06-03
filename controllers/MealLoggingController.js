const getMealLogging = (req, res) => {
    const isLoggedIn = req.session.userId ? true : false;

    res.render('MealLogging', {
        title: 'Meal Logging',
        isLoggedIn
    });
};

module.exports = { getMealLogging };
