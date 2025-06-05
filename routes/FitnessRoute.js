const express = require("express");
const router = express.Router();
const FitnessController = require("../controllers/FitnessController");

// GET routes
router.get("/todaySummary", FitnessController.getTodaySummary);
router.get("/activityHistory", FitnessController.getRecentHistory);

// POST routes
router.post("/logWorkout", FitnessController.createWorkout);
router.post("/todaySummary", FitnessController.updateTodaySummary);

module.exports = router;