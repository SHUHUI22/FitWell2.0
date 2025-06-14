const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  carbs: {
    type: Number,
    required: true,
  },
  fat: {
    type: Number,
    required: true,
  },
  protein: {
    type: Number,
    required: true,
  },
  // Optional: add tags, categories, or description
  description: {
    type: String,
  }
}, { timestamps: true });

const Meal = mongoose.model("Meal", mealSchema);
module.exports = Meal;
