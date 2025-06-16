const mongoose = require("mongoose");

const loggedMealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: [true, 'User ID is required'],
    index: true // Add index for better query performance
  },
  mealId: {
    type: String, // Changed from ObjectId to String to store Spoonacular API IDs
    required: [true, 'Meal ID is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Meal title is required'],
    trim: true,
    maxlength: [200, 'Meal title cannot exceed 200 characters']
  },
  image: {
    type: String,
    required: false,
    trim: true
  },
  nutrition: {
    calories: {
      type: Number,
      required: [true, 'Calories value is required'],
      min: [0, 'Calories cannot be negative'],
      default: 0
    },
    carbs: {
      type: Number,
      required: [true, 'Carbs value is required'],
      min: [0, 'Carbs cannot be negative'],
      default: 0
    },
    fat: {
      type: Number,
      required: [true, 'Fat value is required'],
      min: [0, 'Fat cannot be negative'],
      default: 0
    },
    protein: {
      type: Number,
      required: [true, 'Protein value is required'],
      min: [0, 'Protein cannot be negative'],
      default: 0
    }
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true // Add index for better query performance
  },
  mealType: {
    type: String,
    enum: {
      values: ["breakfast", "lunch", "dinner"],
      message: 'Meal type must be breakfast, lunch, or dinner'
    },
    required: [true, 'Meal type is required'],
    lowercase: true,
    trim: true
  },
  servings: {
    type: Number,
    required: [true, 'Servings value is required'],
    min: [0.1, 'Servings must be at least 0.1'],
    max: [50, 'Servings cannot exceed 50'],
    default: 1
  }
}, { 
  timestamps: true,
  // Add compound indexes for efficient queries
  indexes: [
    { userId: 1, date: 1 },
    { userId: 1, mealType: 1, date: 1 }
  ]
});

// Pre-save middleware to ensure nutrition values are numbers
loggedMealSchema.pre('save', function(next) {
  // Ensure all nutrition values are properly converted to numbers
  if (this.nutrition) {
    this.nutrition.calories = parseFloat(this.nutrition.calories) || 0;
    this.nutrition.carbs = parseFloat(this.nutrition.carbs) || 0;
    this.nutrition.fat = parseFloat(this.nutrition.fat) || 0;
    this.nutrition.protein = parseFloat(this.nutrition.protein) || 0;
  }
  
  // Ensure servings is a number
  this.servings = parseFloat(this.servings) || 1;
  
  next();
});

// Add a method to calculate total nutrition per serving
loggedMealSchema.methods.getTotalNutrition = function() {
  return {
    calories: Math.round(this.nutrition.calories * this.servings),
    carbs: Math.round(this.nutrition.carbs * this.servings),
    fat: Math.round(this.nutrition.fat * this.servings),
    protein: Math.round(this.nutrition.protein * this.servings)
  };
};

// Static method to get daily totals for a user
loggedMealSchema.statics.getDailyTotals = async function(userId, date) {
  try {
    const startDate = new Date(date + 'T00:00:00.000Z');
    const endDate = new Date(date + 'T23:59:59.999Z');
    
    const meals = await this.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: startDate,
        $lt: endDate
      }
    });

    const totals = {
      calories: 0,
      carbs: 0,
      fat: 0,
      protein: 0
    };

    meals.forEach(meal => {
      totals.calories += (meal.nutrition.calories || 0) * (meal.servings || 1);
      totals.carbs += (meal.nutrition.carbs || 0) * (meal.servings || 1);
      totals.fat += (meal.nutrition.fat || 0) * (meal.servings || 1);
      totals.protein += (meal.nutrition.protein || 0) * (meal.servings || 1);
    });

    // Round all values
    Object.keys(totals).forEach(key => {
      totals[key] = Math.round(totals[key]);
    });

    return totals;
  } catch (error) {
    console.error('Error calculating daily totals:', error);
    return {
      calories: 0,
      carbs: 0,
      fat: 0,
      protein: 0
    };
  }
};

// Static method to get meals grouped by type for a specific date
loggedMealSchema.statics.getMealsGroupedByType = async function(userId, date) {
  try {
    const startDate = new Date(date + 'T00:00:00.000Z');
    const endDate = new Date(date + 'T23:59:59.999Z');
    
    const meals = await this.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort({ createdAt: -1 });

    const groupedMeals = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    meals.forEach(meal => {
      if (groupedMeals[meal.mealType]) {
        groupedMeals[meal.mealType].push({
          id: meal._id,
          title: meal.title,
          image: meal.image,
          nutrition: meal.nutrition,
          servings: meal.servings,
          totalNutrition: meal.getTotalNutrition()
        });
      }
    });

    return groupedMeals;
  } catch (error) {
    console.error('Error grouping meals by type:', error);
    return {
      breakfast: [],
      lunch: [],
      dinner: []
    };
  }
};

// Add error handling for validation
loggedMealSchema.post('save', function(error, doc, next) {
  if (error.name === 'ValidationError') {
    console.error('Validation error saving meal:', error.message);
  }
  next();
});

const LoggedMeal = mongoose.model("LoggedMeal", loggedMealSchema);
module.exports = LoggedMeal;