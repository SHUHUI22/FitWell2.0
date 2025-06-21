const express = require('express');
const router = express.Router();
const CalculatorController = require('../controllers/CalculatorController');

// GET route to render Favourite Meals page
router.get('/NutritionPlanner/Calculator', CalculatorController.getCalculator);

// POST route for analyzing ingredients
router.post('/api/nutrition-analyze', CalculatorController.analyzeIngredients);

module.exports = router;