const mongoose = require("mongoose");

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
    targetWeight: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        enum: ["male","female"],
        required: true
    },
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date},

   notification: {
  type: Object,
  default: {
    water: true,
    nutrition: true,
    workout: true
  }
}
 
});

// Collection name: users (MongoDB will make it lowercase automatically)
const Users = mongoose.model("Users",userSchema);

module.exports = Users;