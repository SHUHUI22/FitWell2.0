const { Workout, Summary } = require('../models/Fitness');
const mongoose = require("mongoose");

async function showFitnessPage(req, res) {
    console.log("Session data:", req.session);

    try {
        const userId = new mongoose.Types.ObjectId(req.session.userId);
        console.log("User ID at showFitnessPage:", userId);

        const today = new Date().toISOString().split('T')[0];

        // Get today's summary
        const summary = await Summary.findOne({ userId, date: today });

        // Get recent workouts (limit to 3)
        const recentHistory = await Workout.find({ userId }).sort({ date: -1 }).limit(3);
        console.log("Recent History:", recentHistory);
        
        return res.render("FitnessTracker", {
            steps: summary?.steps || 0,
            stepGoal: summary?.stepGoal || 10000,
            distance: summary?.distance || '0.0 km',
            caloriesBurned: summary?.caloriesBurned || '0 kcal',
            duration: summary?.duration || '0 min',
            recentHistory
        });

    } catch (err) {
        return res.status(500).json({ error: 'Failed to load fitness page', message: err.message });
    }
}

module.exports = { showFitnessPage }
