const { Workout, Summary} = require('../models/Fitness');
const Users = require('../models/Users')

function getIcon(type) {
  switch (type) {
    case 'Cycling':
      return 'fa-person-biking';
    case 'Running':
      return 'fa-person-running';
    case 'Aerobic':
      return 'fa-heart-pulse';
    case 'Yoga':
      return 'fa-person-praying';
    case 'Zumba':
      return 'fa-music';
    default: return 'fa-dumbbell';
  }
}

async function getActivityHistory(req,res){
    try{
        const userId = req.session.userId;
        // Find user weight from database
        const user = await Users.findById(userId);
        const weight = user?.weight;

        //get pagination values from query
        const page = parseInt(req.query.page)|| 1;
        const limit = parseInt(req.query.limit)|| 10;
        const skip = (page -1)* limit;

        //fetch
        const activities = await Workout.find({ userId }).sort({ date: -1, _id: -1 })
        .skip(skip).limit(limit);

        // count total entries for pagination UI
        const total = await Workout.countDocuments({ userId });
        const totalPages = Math.ceil(total / limit);

        return res.render('History', {activities, page, totalPages, total, weight});

    }catch(err){
        return res.status(500).json({error: 'Failed to fetch workout history', message: err.message });
    }
}

async function updateActivity(req, res){
    try{

        const userId = req.session.userId;
        const activityId = req.params.id;
        const {detail, duration, caloriesBurned} = req.body;

        // Find the existing activity to get old values
        const existingActivity = await Workout.findOne({ _id: activityId, userId: userId });
        if (!existingActivity) {
            return res.status(404).json({ error: 'Activity not found or not authorized' });
        }

        // Old values
        const oldDuration = existingActivity.duration;
        const oldCaloriesBurned = existingActivity.caloriesBurned;
        const workoutType = existingActivity.workoutType;
        const oldDistance = workoutType === 'Cycling' ? Number(existingActivity.detail) : 0;
        const oldSteps = workoutType === 'Running' ? Number(existingActivity.detail) : 0;

         // New values
        const newDuration = Number(duration);
        const newCaloriesBurned = Number(caloriesBurned);
        const newDistance = workoutType === 'Cycling' ? Number(detail) : 0;
        const newSteps = workoutType === 'Running' ? Number(detail) : 0;

        // Update the summary
        const startOfDay = new Date(existingActivity.date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(existingActivity.date);
        endOfDay.setHours(23, 59, 59, 999);
        let summary = await Summary.findOneAndUpdate(
            { userId, date: { $gte: startOfDay, $lte: endOfDay } },
            {
                $inc: {
                    steps: newSteps - oldSteps,
                    distance: newDistance - oldDistance,
                    caloriesBurned: newCaloriesBurned - oldCaloriesBurned,
                    duration: newDuration - oldDuration
                }
            },
            { new: true}
        );

        // Update the activity
        const updatedActivity = await Workout.findOneAndUpdate(
            {_id: activityId, userId: userId},
            {detail, duration, caloriesBurned},
            {new: true} // return updated document
        );
        
        res.status(200).json({ message: 'Activity updated successfully', updatedActivity });

    }catch (err){
        console.error(err);
        res.status(500).json({ error: 'Failed to update activity', message: err.message});
    }
}

async function deleteActivity(req, res){
    try {
        const userId = req.session.userId;
        const activityId = req.params.id;

        // Fetch the activity first
        const activity = await Workout.findOne({ _id: activityId, userId: userId });
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found or not authorized' });
        }

        const { detail, duration, caloriesBurned, workoutType, date } = activity;

        // Compute values to subtract
        const distance = workoutType === 'Cycling' ? Number(detail) : 0;
        const steps = workoutType === 'Running' ? Number(detail) : 0;

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Update the summary
        await Summary.findOneAndUpdate(
            {
                userId,
                date: { $gte: startOfDay, $lte: endOfDay }
            },
            {
                $inc: {
                    steps: -steps,
                    distance: -distance,
                    caloriesBurned: -Number(caloriesBurned),
                    duration: -Number(duration)
                }
            }
        );
          
          // Delete activity
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