const mongoose = require("mongoose");

const loggedMealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Meal",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "dinner"],
    required: true,
  },
  servings: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  }
}, { timestamps: true });

const LoggedMeal = mongoose.model("LoggedMeal", loggedMealSchema);
module.exports = LoggedMeal;
