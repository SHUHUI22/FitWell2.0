const getFavouriteMeal = (req, res) => {
    const isLoggedIn = req.session.userId ? true : false;

    res.render('FavouriteMeal', {
        title: 'Favourite Meal',
        isLoggedIn
    });
};

module.exports = { getFavouriteMeal };
