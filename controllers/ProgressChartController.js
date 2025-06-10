const Users = require("../models/Users");
const { Workout } = require("../models/Fitness");
const mongoose = require("mongoose");

class ProgressChartController {
  // Get Progress Chart page with user data
  static async getProgressChart(req, res) {
    try {
      // Check if user is logged in (assuming you store user ID in session)
      if (!req.session.userId) {
        return res.redirect("/login");
      }

      // Retrieve user data from MongoDB
      const user = await Users.findById(req.session.userId);

      if (!user) {
        return res.redirect("/login");
      }

      // Get current weight from weight history
      const currentWeight = ProgressChartController.getCurrentWeight(user);
      
      // If no current weight, you might want to redirect to profile setup
      if (!currentWeight) {
        console.log('No weight data found for user:', user.username);
        // You could redirect to a setup page or use a default value
      }

      // Calculate BMI
      const heightInMeters = user.height / 100; // Convert cm to meters
      const bmi = user.weight / (heightInMeters * heightInMeters);
      const roundedBMI = Math.round(bmi * 10) / 10; // Round to 1 decimal place

      // Determine BMI status
      let bmiStatus;
      if (roundedBMI < 18.5) {
        bmiStatus = "Underweight";
      } else if (roundedBMI >= 18.5 && roundedBMI < 25) {
        bmiStatus = "Normal";
      } else if (roundedBMI >= 25 && roundedBMI < 30) {
        bmiStatus = "Overweight";
      } else {
        bmiStatus = "Obese";
      }

      // Workout Streak and Top Workout Types
      const streak = await ProgressChartController.getWorkoutStreak(user._id);
      const topWorkoutTypes = await ProgressChartController.getTopWorkoutTypes(user._id);
      const last7DaysData = await ProgressChartController.getLast7DaysDuration(user._id);
      const monthlyCalories = await ProgressChartController.getMonthlyCalories(user._id);
      const weeklyCalories = await ProgressChartController.getWeeklyCalories(user._id);
      const weightHistory = await ProgressChartController.getWeightHistory(user._id, 90); // Last 90 days

      // Prepare data for the progress chart
      const progressData = {
        username: user.username,
        height: user.height,
        weight: user.weight,
        targetWeight: user.targetWeight,
        bmi: roundedBMI,
        bmiStatus: bmiStatus,
        age: user.age,
        gender: user.gender,
        email: user.email,
        streak: streak,
        topWorkoutTypes: topWorkoutTypes,
        last7DaysLabels: last7DaysData.labels,
        last7DaysDurations: last7DaysData.durations,
        monthlyCalories: monthlyCalories,
        weeklyCalories: weeklyCalories,
        weightHistoryLabels: weightHistory.labels,
        weightHistoryData: weightHistory.weights,
      };

      console.log("Progress data prepared for user:", user.username);
      console.log("BMI calculated:", roundedBMI, "Status:", bmiStatus);
      console.log("Weight history data:", weightHistory);

      // Render the progress chart page with user data
      res.render("ProgressChart", progressData);
    } catch (error) {
      console.error("Error retrieving user data for progress chart:", error);
      res.status(500).send("Unable to load progress chart. Please try again.");
    }
  }

  // Helper method to calculate BMI
  static calculateBMI(weight, height) {
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
  }

  // Helper method to get BMI status
  static getBMIStatus(bmi) {
    if (bmi < 18.5) {
      return "Underweight";
    } else if (bmi >= 18.5 && bmi < 25) {
      return "Normal";
    } else if (bmi >= 25 && bmi < 30) {
      return "Overweight";
    } else {
      return "Obese";
    }
  }

  static async getTopWorkoutTypes(userId) {
    const types = await Workout.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$workoutType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      // { $limit: 3 }
    ]);

    return types.map((entry) => ({
      type: entry._id,
      count: entry.count,
    }));
  }


// Fixed version of the monthly and weekly calories methods
static async getMonthlyCalories(userId) {
  const currentYear = new Date().getFullYear();
  
  const monthlyCalories = await Workout.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        date: { 
          $gte: new Date(`${currentYear}-01-01`),
          $lt: new Date(`${currentYear + 1}-01-01`)
        }
      } 
    },
    {
      $group: {
        _id: { $month: "$date" },
        totalCalories: { $sum: "$caloriesBurned" }
      }
    },
    {
      $sort: { "_id": 1 }
    }
  ]);

  // Create array with all 12 months, filling in 0 for months with no data
  const monthlyData = Array(12).fill(0);
  monthlyCalories.forEach(item => {
    monthlyData[item._id - 1] = item.totalCalories;
  });

  return monthlyData;
}

static async getWeeklyCalories(userId) {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0); // Start of 7 days ago

  const result = await Workout.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: sevenDaysAgo, $lte: today },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        totalCalories: { $sum: "$caloriesBurned" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Create array for last 7 days (same logic as duration chart)
  const weeklyData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Find calories for this date
    const dayData = result.find((r) => r._id === dateStr);
    weeklyData.push(dayData ? dayData.totalCalories : 0);
  }

  return weeklyData;
}

  static async getLast7DaysDuration(userId) {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Start of 7 days ago

    const result = await Workout.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: sevenDaysAgo, $lte: today },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalDuration: { $sum: "$duration" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Create arrays for last 7 days
    const labels = [];
    const durations = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Find duration for this date
      const dayData = result.find((r) => r._id === dateStr);

      // Format label (e.g., "Mon 12/9" or just "Mon")
      const dayLabel = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      });

      labels.push(dayLabel);
      durations.push(dayData ? dayData.totalDuration : 0);
    }

    return { labels, durations };
  }

  static async getWorkoutStreak(userId) {
  const workouts = await Workout.find({ userId })
    .select("date")
    .sort({ date: -1 });

  // Convert workout dates to local YYYY-MM-DD strings
  const workoutDateSet = new Set(
    workouts.map(w =>
      new Date(w.date).toLocaleDateString("en-CA") // 'YYYY-MM-DD' in local time
    )
  );

  let streak = 0;

  // Start from today (LOCAL time)
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Local midnight

  while (true) {
    const dateStr = currentDate.toLocaleDateString("en-CA");

    if (workoutDateSet.has(dateStr)) {
      streak++;
    } else {
      break;
    }

    // Go back one day
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// Helper method to get current weight from weight history
  static getCurrentWeight(user) {
    if (!user.weightHistory || user.weightHistory.length === 0) {
      return null;
    }
    
    // Get the most recent weight entry
    const sortedHistory = user.weightHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedHistory[0].weight;
  }

  // Fixed getWeightHistory method
  static async getWeightHistory(userId, days = 30) {
    try {
      const user = await Users.findById(userId);
      if (!user) {
        console.log('User not found for weight history');
        return { labels: [], weights: [] };
      }

      // Check if user has weight history
      if (!user.weightHistory || user.weightHistory.length === 0) {
        console.log('No weight history found for user');
        return { labels: [], weights: [] };
      }

      // Get weight history for the specified number of days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Filter and sort weight history
      const recentHistory = user.weightHistory
        .filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= cutoffDate && !isNaN(entryDate.getTime()) && entry.weight != null;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // If no recent history, return empty arrays
      if (recentHistory.length === 0) {
        console.log('No recent weight history found');
        return { labels: [], weights: [] };
      }

      // Format data for chart
      const labels = recentHistory.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString("en-US", { 
          month: "short", 
          day: "numeric" 
        });
      });
      
      const weights = recentHistory.map(entry => entry.weight);

      console.log('Weight history data:', { labels, weights });
      return { labels, weights };
    } catch (error) {
      console.error("Error getting weight history:", error);
      return { labels: [], weights: [] };
    }
  }


// static async migrateExistingWeights() {
//   try {
//     const users = await Users.find({ weight: { $exists: true, $ne: null } });
    
//     for (const user of users) {
//       // Only add to history if weightHistory is empty or doesn't exist
//       if (!user.weightHistory || user.weightHistory.length === 0) {
//         user.weightHistory = [{
//           weight: user.weight,
//           date: new Date()
//         }];
//         await user.save();
//         console.log(`Migrated weight for user: ${user.username}`);
//       }
//     }
    
//     console.log(`Migration completed for ${users.length} users`);
//   } catch (error) {
//     console.error("Migration error:", error);
//   }
// }



  // Method to update user progress (for future use)
  static async updateUserProgress(req, res) {
    try {
      const { userId } = req.session;
      const { weight, height } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Update user data
      const updatedUser = await Users.findByIdAndUpdate(
        userId,
        {
          weight: weight || undefined,
          height: height || undefined,
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Recalculate BMI
      const newBMI = ProgressChartController.calculateBMI(
        updatedUser.weight,
        updatedUser.height
      );
      const bmiStatus = ProgressChartController.getBMIStatus(newBMI);

      res.json({
        success: true,
        message: "Progress updated successfully",
        data: {
          weight: updatedUser.weight,
          height: updatedUser.height,
          bmi: newBMI,
          bmiStatus: bmiStatus,
        },
      });
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ error: "Unable to update progress" });
    }
  }
}

module.exports = ProgressChartController;
