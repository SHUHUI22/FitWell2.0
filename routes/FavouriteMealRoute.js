const express = require('express');
const router = express.Router();
const FavouriteMealController = require('../controllers/FavouriteMealController');

// GET route to render Favourite Meals page
router.get('/FavouriteMeal', FavouriteMealController.getFavouriteMeal);

module.exports = router;
