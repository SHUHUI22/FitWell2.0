const express = require("express");
const router = express.Router();
const FitnessController = require("../controllers/FitnessController");

// GET routes
router.get("/Fitness", FitnessController.showFitnessPage);

// POST routes
router.post("/Fitness", FitnessController.createWorkout);
router.post("/Fitness/updateStepGoal", FitnessController.updateStepGoal);

module.exports = router;