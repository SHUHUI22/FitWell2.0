const { Workout } = require('../models/Fitness');

async function getActivityHistory(req,res){
    try{
        const userId = req.session.userId;

        //get pagination values from query
        const page = parseInt(req.query.page)|| 1;
        const limit = parseInt(req.query.limit)|| 10;
        const skip = (page -1)* limit;

        //fetch
        const activities = await Workout.find({ userId }).sort({ date: -1 })
        .skip(skip).limit(limit);

        // count total entries for pagination UI
        const total = await Workout.countDocuments({ userId });
        const totalPages = Math.ceil(total / limit);

        return res.render('history', {activities, page, totalPages, total});

    }catch(err){
        return res.status(500).json({error: 'Failed to fetch workout history', message: err.message });
    }
}


module.exports = {getActivityHistory};