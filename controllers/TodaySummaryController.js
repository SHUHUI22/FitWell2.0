const { Summary } = require('../models/Fitness');

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

    }catch(err){
        return res.status(500).json({ error: 'Failed to fetch today summary', message: err.message });
    }
}

module.exports = {
    updateTodaySummary,
    getTodaySummary
}