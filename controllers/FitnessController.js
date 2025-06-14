const { Workout,Summary } = require('../models/Fitness');
const Users = require('../models/Users'); 
const mongoose = require("mongoose");

// Show Fitness Page
async function showFitnessPage(req, res) {
    console.log("Session data:", req.session);
    
    // Find user weight from database
    const userId = req.session.userId;
    const user = await Users.findById(userId);
    const weight = user?.weight;

    try {
        // const userId = new mongoose.Types.ObjectId(req.session.userId);
        console.log("User ID at showFitnessPage:", userId);

        // const today = new Date().toISOString().split('T')[0];
        // Define full date range for today
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        // Get today's summary
        const summary = await Summary.findOne({ userId, date: { $gte: start, $lte: end } });

        // Get recent workouts (limit to 2)
        const recentHistory = await Workout.find({ userId }).sort({ date: -1 }).limit(2);
        console.log("Recent History:", recentHistory);
        
        return res.render("FitnessTracker", {
            steps: summary?.steps || 0,
            stepGoal: summary?.stepGoal || 10000,
            distance: summary?.distance || 0,
            caloriesBurned: summary?.caloriesBurned || 0,
            duration: summary?.duration || 0,
            recentHistory,
            weight  
        });

    } catch (err) {
        return res.status(500).json({ error: 'Failed to load fitness page', message: err.message });
    }
}

// create log workout
async function createWorkout(req,res) {
    console.log("createWorkout() triggered");
    try{
        const userId = req.session.userId;
        // get data from log
        const {
            workoutType,
            duration,
            date,
            detail,
            caloriesBurned
        }= req.body;

        //assign icon based on workoutType
        const iconMap = {
            "Running": "fa-person-running",
            "Cycling": "fa-person-biking",
            "Aerobic": "fa-heart-pulse",
            "Yoga": "fa-person-praying",
            "Zumba": "fa-music"
        }

        const icon = iconMap[workoutType] || "fa-person-walking";

        // create new log
        const newWorkout = new Workout({
            userId,
            workoutType,
            duration,
            date,
            detail,
            caloriesBurned,
            icon
        });
        console.log("Saving workout:", newWorkout);

        await newWorkout.save();

        // Update today summary
        const today = new Date().toISOString().split('T')[0];
        const existingSummary = await Summary.findOne({ userId, date: today });

        if(existingSummary){
            // Update existing summary values 
            if(workoutType == "Cycling"){
                existingSummary.distance += Number(detail);
            }
            if(workoutType == "Running"){
                existingSummary.steps += Number(detail);       
            }
            existingSummary.caloriesBurned += Number(caloriesBurned);
            existingSummary.duration += Number(duration);
            await existingSummary.save();
        }
        else{
            // Create a new summary for today
            if(workoutType == "Cycling"){
                dis = Number(detail);
            }
            else{
                dis = 0;
            }
            if(workoutType == "Running"){
                step = Number(detail);      
            }
            else{
                step = 0;
            }
            const newSummary = new Summary({
                userId,
                date: today,
                steps: step,
                stepGoal: 10000,
                distance: dis,
                caloriesBurned: Number(caloriesBurned),
                duration: Number(duration)
            });
            await newSummary.save();
        }
        
        return res.redirect('/FitWell/Fitness');
    }catch(err){
        return res.status(500).json({error: 'Failed to create workout', message: err.message });
    }
}

// Update steps goal
async function updateStepGoal(req, res) {
    try {
        const userId = req.session.userId;
        const { stepGoal } = req.body;

        const today = new Date().toISOString().split('T')[0];

        let summary = await Summary.findOne({ userId, date: today });

        if (!summary) {
            // Create a new summary for today if it doesn't exist
            summary = new Summary({
                userId,
                date: today,
                steps: 0,
                stepGoal: Number(stepGoal),
                distance: 0,
                caloriesBurned: 0,
                duration: 0
            });
        } else {
            summary.stepGoal = Number(stepGoal);
        }

        await summary.save();

        return res.redirect('/FitWell/Fitness');
    } catch (err) {
        return res.status(500).json({ error: 'Failed to update step goal', message: err.message });
    }
}

module.exports = {showFitnessPage, createWorkout, updateStepGoal};