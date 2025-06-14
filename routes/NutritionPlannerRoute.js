const express = require('express');
const router = express.Router();
const NutritionPlannerController = require('../controllers/NutritionPlannerController');

// GET route for the main Nutrition Planner page
router.get('/NutritionPlanner', NutritionPlannerController.getNutritionPlanner);

module.exports = router;
