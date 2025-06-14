const mongoose = require("mongoose");

const weightEntrySchema = new mongoose.Schema({
    weight: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { _id: true }); 

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    },
    weightHistory: {
    type: [weightEntrySchema],
    default: []
    },
    targetWeight: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ["male","female"],
        required: true
    },
    profilePic: {
        data: Buffer,
        contentType: String
    }, 
    notification:{
        workout: {
            type: Boolean,
            default: true
        },
        nutrition: {
            type: Boolean,
            default: true
        },
        water: {
            type: Boolean,
            default: true
        }
    },

    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date}
    
});

// Collection name: users (MongoDB will make it lowercase automatically)
const Users = mongoose.model("Users",userSchema);

module.exports = Users;