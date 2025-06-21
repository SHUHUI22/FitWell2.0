const express = require('express');
const router = express.Router();
const MealSuggestionController = require('../controllers/MealSuggestionController');

// GET route to render the Meal Suggestion page
router.get('/NutritionPlanner/MealSuggestion', MealSuggestionController.getMealSuggestion);

// API to fetch meals from Spoonacular
router.get('/api/meals', MealSuggestionController.searchMeals);

module.exports = router;
