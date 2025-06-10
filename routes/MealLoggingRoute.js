const express = require('express');
const router = express.Router();
const MealLoggingController = require('../controllers/MealLoggingController');

// GET route to render Meal Logging page
router.get('/MealLogging', MealLoggingController.getMealLogging);

// POST route to log a meal
router.post('/MealLogging/log', MealLoggingController.logMeal);

// GET route to fetch meals for a specific date
router.get('/MealLogging/meals', MealLoggingController.getMealsForDate);

// DELETE route to remove a logged meal
router.delete('/MealLogging/meal/:mealId', MealLoggingController.deleteMeal);

// PUT route to update a logged meal (e.g., change servings)
router.put('/MealLogging/meal/:mealId', MealLoggingController.updateMeal);

module.exports = router;
