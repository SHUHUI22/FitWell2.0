const express = require('express');
const router = express.Router();
const MealLoggingController = require('../controllers/MealLoggingController');

// GET route to render Meal Logging page
router.get('/MealLogging', MealLoggingController.getMealLogging);

module.exports = router;
