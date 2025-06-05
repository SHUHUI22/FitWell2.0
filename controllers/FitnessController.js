const { Workout, Summary } = require('../models/Fitness');

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
        return res.render('workoutCreated', { workout: savedWorkout});
    }catch(err){
        return res.status(500).json({error: 'Failed to create workout', message: err.message });
    }
}

async function updateTodaySummary(req,res){
    try{
        const userId = req.session.userId;
        //ensure is current day
        const today = new Date().toISOString().split('T')[0];
        const {
            steps, 
            stepGoal,
            distance,
            caloriesBurned,
            duration
        }= req.body;

        const updated = await Summary.findOneAndUpdate(
            { userId, date: today },
            { steps, stepGoal, distance, caloriesBurned, duration },
            { 
                upsert: true, //create if it doesnt exist
                new: true, //update
                setDefaultsOnInsert: true 
            }
        )

        return res.status(200).json(updated);

    }catch(err){

        return res.status(500).json({ error: 'Failed to save today summary', message: err.message });
    }
}

//get today's summary
async function getTodaySummary(req, res){
    try{
        const userId = req.session.userId;
        const today = new Date().toISOString().split('T')[0];

        const summary = await Summary.findOne({
            userId, date: today
        });

        if(!summary){
            return res.status(404).json({ message: 'No summary found for today'});
        }

        return res.render("FitnessTracker", {
            steps: summary?.steps || 0,
            stepGoal: summary?.stepGoal || 10000,
            distance: summary?.distance || '0.0 km',
            caloriesBurned: summary?.caloriesBurned || '0 kcal',
            duration: summary?.duration || '0 min'
        });

    }catch(err){
        return res.status(500).json({ error: 'Failed to fetch today summary', message: err.message });
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

module.exports = {
    createWorkout,
    updateTodaySummary,
    getTodaySummary,
    getRecentHistory
}