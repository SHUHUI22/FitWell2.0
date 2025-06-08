const { Workout } = require('../models/Fitness');
// create log workout
async function createWorkout(req,res) {
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
            "running": "fa-person-running",
            "cycling": "fa-bicycle",
            "aerobic": "fa-person-dress",
            "yoga": "fa-person-praying",
            "zumba": "fa-music"
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

        const savedWorkout = await newWorkout.save();
        
        return res.redirect('/FitWell/fitness').render('fitness', {savedWorkout});
    }catch(err){
        return res.status(500).json({error: 'Failed to create workout', message: err.message });
    }
}

//show 3 recent logs only
async function getRecentHistory(req,res){
    try{
        const userId = req.session.userId;
        const recentHistory = await Workout.find({ userId }).sort({ date: -1 }).limit(3);
        return res.render('fitness', { recentHistory});

    }catch(err){
        return res.status(500).json({error: 'Failed to fetch workout history', message: err.message });
    }
}

module.exports = {createWorkout, getRecentHistory};