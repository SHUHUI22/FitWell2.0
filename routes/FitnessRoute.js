const express = require("express");
const router = express.Router();
const FitnessTrackerController = require("../controllers/FitnessTrackerController");
const LogWorkoutController = require("../controllers/LogWorkoutController");
const TodaySummaryController = require("../controllers/TodaySummaryController");

// GET routes
router.get("/fitness", FitnessTrackerController.showFitnessPage);
router.get("/summary", TodaySummaryController.getTodaySummary);
// POST routes
router.post("/fitness", LogWorkoutController.createWorkout);
router.post("/summary", TodaySummaryController.updateTodaySummary);

module.exports = router;