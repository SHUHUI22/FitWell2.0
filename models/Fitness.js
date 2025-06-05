const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
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
});

const summaryScheme = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    },
    date:{
        type: Date,
        required: true
    },
    steps: { 
        type: Number, 
        required: true 
    },
    stepGoal: { 
        type: Number, 
        required: true 
    },
    distance: { 
        type: Number, 
        required: true 
    }, 
    caloriesBurned: { 
        type: Number, 
        required: true 
    }, 
    duration: { 
        type: Number, 
        required: true 
    } 
});

const Workout = mongoose.model('Workout', workoutSchema);
const Summary = mongoose.model('Summary', summaryScheme);

module.exports = {
    Workout,
    Summary
}