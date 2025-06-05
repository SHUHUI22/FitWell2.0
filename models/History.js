const mongoose = require('mongoose');

const activityHistorySchema = new mongoose.Schema({
    userId:{
            type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
        },
        workoutType: {
            type: String,
            required: true
        },
        duration: {
            type: Number,
            required: true
        },
        date:{
            type: Date,
            required: true
        },
        detail:{
            type: String,
            required: true
        },
        caloriesBurned:{
            type: Number,
            required: true
        }
})
const History = mongoose.model('History',activityHistorySchema);

module.exports = History;