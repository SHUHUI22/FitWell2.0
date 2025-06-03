const mongoose = require("mongoose");

const favouriteMealSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",  // reference to the Users collection
        required: true
    },
    mealId: {
        type: String,  // unique identifier for the meal (could be an external API id or internal id)
        required: true
    },
    mealName: {
        type: String,
        required: true
    },
    mealImage: {
        type: String  // URL or path to image
    },
    calories: Number,
    carbs: Number,
    fat: Number,
    protein: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure a user can't favourite the same meal more than once
favouriteMealSchema.index({ userId: 1, mealId: 1 }, { unique: true });

const FavouriteMeal = mongoose.model("FavouriteMeal", favouriteMealSchema);

module.exports = FavouriteMeal;
