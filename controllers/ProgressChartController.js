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
      };

      console.log("Progress data prepared for user:", user.username);
      console.log("BMI calculated:", roundedBMI, "Status:", bmiStatus);

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
  // Get calories for the current week (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6); // Last 7 days including today

  const dailyCalories = await Workout.aggregate([
    { 
      $match: { 
        userId: new mongoose.Types.ObjectId(userId),
        date: {  
          $gte: startDate,
          $lte: endDate
        }
      } 
    },
    {
      $group: {
        _id: { 
          dayOfWeek: { $dayOfWeek: "$date" }, 
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date" 
            }
          }
        },
        totalCalories: { $sum: "$caloriesBurned" }
      }
    },
    {
      $sort: { "_id.date": 1 }
    }
  ]);

  // Create array for 7 days (Mon-Sun), MongoDB dayOfWeek: 1=Sunday, 2=Monday, etc.
  const weeklyData = Array(7).fill(0);
  const dayMapping = [6, 0, 1, 2, 3, 4, 5]; // Map MongoDB dayOfWeek to array index (Mon=0, Sun=6)
  
  dailyCalories.forEach(item => {
    const mongoDayOfWeek = item._id.dayOfWeek;
    const arrayIndex = dayMapping[mongoDayOfWeek - 1];
    weeklyData[arrayIndex] = item.totalCalories;
  });

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
