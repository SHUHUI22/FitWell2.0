const { Workout } = require('../models/Fitness');

function getIcon(type) {
  switch (type.toLowerCase()) {
    case 'cycling':
      return 'fa-person-biking';
    case 'running':
      return 'fa-person-running';
    case 'walking':
      return 'fa-person-walking';
    case 'aerobic':
      return 'fa-heart-pulse';
    case 'yoga':
      return 'fa-person-praying';
    case 'zumba':
      return 'fa-music';
    default: return 'fa-dumbbell';
  }
}

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

async function updateActivity(req, res){
    try{

        const userId = req.body.userId;
        const activityId = req.params.id;
        const {detail, duration, caloriesBurned} = req.body;

        const activity = await Workout.findOneAndUpdate(
            {_id: activityId, userId: userId},
            {detail, duration, caloriesBurned, getIcon},
            {new: true} // return updated document
        );

        if (!activity) {
            return res.status(404).json({ error: 'Activity not found or not authorized' });
        }
        res.status(200).json({ message: 'Activity updated successfully', activity });

    }catch (err){
        console.error(err);
        res.status(500).json({ error: 'Failed to update activity', message: err.message});
    }
}

async function deleteActivity(req, res){
    try {
        const userId = req.session.userId;
        const activityId = req.params.id;

        const deleted = await Workout.findOneAndDelete(
            { _id: activityId, userId: userId }
        );

        if (!deleted) {
            return res.status(404).json({ error: 'Activity not found or not authorized' });
        }

        res.status(200).json({ message: 'Activity deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete activity', message: err.message });
    }
}


module.exports = {getActivityHistory, updateActivity, deleteActivity};