const express = require('express');
const router = express.Router();
const FavouriteMealController = require('../controllers/FavouriteMealController');

// GET route to render the Favourite Meal page
router.get('/FavouriteMeal', (req, res) => {
    const isLoggedIn = req.session.userId ? true : false;
    
    res.render('FavouriteMeal', {
        title: 'Favourite Meals',
        isLoggedIn
    });
});

// Test route to check if routing is working
router.get('/api/test-favourites', (req, res) => {
    res.json({ message: 'Favourites routing is working!', userId: req.session.userId });
});

// API routes for favourite meal operations
// GET /api/favourites - Get all favourite meals for the logged-in user
router.get('/api/favourites', FavouriteMealController.getFavourites);

// POST /api/favourites - Add a meal to favourites
router.post('/api/favourites', FavouriteMealController.addToFavourites);

// DELETE /api/favourites/:mealId - Remove a meal from favourites
router.delete('/api/favourites/:mealId', FavouriteMealController.removeFromFavourites);

// GET /api/favourites/check/:mealId - Check if a meal is in favourites
router.get('/api/favourites/check/:mealId', FavouriteMealController.checkFavouriteStatus);

module.exports = router;