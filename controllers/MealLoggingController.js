const LoggedMeal = require('../models/LoggedMeal');
const mongoose = require('mongoose');

const getMealLogging = async (req, res) => {
    try {
        const isLoggedIn = req.session.userId ? true : false;
        
        if (!isLoggedIn) {
            return res.redirect('/FitWell/login');
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch logged meals for today
        const loggedMeals = await LoggedMeal.find({
            userId: req.session.userId,
            date: {
                $gte: new Date(today + 'T00:00:00.000Z'),
                $lt: new Date(today + 'T23:59:59.999Z')
            }
        }).sort({ createdAt: -1 });

        res.render('MealLogging', {
            title: 'Meal Logging',
            isLoggedIn,
            loggedMeals: loggedMeals || []
        });
    } catch (error) {
        console.error('Error fetching meal logging page:', error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Failed to load meal logging page'
        });
    }
};

const logMeal = async (req, res) => {
    try {
        console.log('=== Log Meal Request Debug ===');
        console.log('Session userId:', req.session.userId);
        console.log('Request body:', req.body);
        console.log('Request headers:', req.headers);

        // Check if user is logged in
        if (!req.session.userId) {
            console.log('User not logged in - no session userId');
            return res.status(401).json({ 
                success: false,
                error: 'User not logged in' 
            });
        }

        const { mealId, title, image, nutrition, servings, mealType, date } = req.body;
        
        // Validate required fields
        const missingFields = [];
        if (!mealId) missingFields.push('mealId');
        if (!title) missingFields.push('title');
        if (!nutrition) missingFields.push('nutrition');
        if (!servings) missingFields.push('servings');
        if (!mealType) missingFields.push('mealType');
        if (!date) missingFields.push('date');

        if (missingFields.length > 0) {
            console.log('Missing required fields:', missingFields);
            return res.status(400).json({ 
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        // Validate nutrition object
        if (!nutrition.calories && nutrition.calories !== 0) {
            console.log('Invalid nutrition data - missing calories');
            return res.status(400).json({ 
                success: false,
                error: 'Invalid nutrition data - calories is required' 
            });
        }

        // Validate mealType
        const validMealTypes = ['breakfast', 'lunch', 'dinner'];
        if (!validMealTypes.includes(mealType.toLowerCase())) {
            console.log('Invalid meal type:', mealType);
            return res.status(400).json({ 
                success: false,
                error: `Invalid meal type. Must be one of: ${validMealTypes.join(', ')}` 
            });
        }

        // Validate date format
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            console.log('Invalid date format:', date);
            return res.status(400).json({ 
                success: false,
                error: 'Invalid date format' 
            });
        }

        // Validate servings
        const servingsNum = parseFloat(servings);
        if (isNaN(servingsNum) || servingsNum <= 0) {
            console.log('Invalid servings:', servings);
            return res.status(400).json({ 
                success: false,
                error: 'Servings must be a positive number' 
            });
        }

        console.log('All validations passed, creating meal...');

        // Create new logged meal
        const loggedMeal = new LoggedMeal({
            userId: new mongoose.Types.ObjectId(req.session.userId),
            mealId: mealId.toString(),
            title: title.trim(),
            image: image || '',
            nutrition: {
                calories: parseFloat(nutrition.calories) || 0,
                carbs: parseFloat(nutrition.carbs) || 0,
                fat: parseFloat(nutrition.fat) || 0,
                protein: parseFloat(nutrition.protein) || 0
            },
            servings: servingsNum,
            mealType: mealType.toLowerCase().trim(),
            date: dateObj
        });

        console.log('Meal object created:', {
            userId: loggedMeal.userId,
            mealId: loggedMeal.mealId,
            title: loggedMeal.title,
            nutrition: loggedMeal.nutrition,
            servings: loggedMeal.servings,
            mealType: loggedMeal.mealType,
            date: loggedMeal.date
        });

        const savedMeal = await loggedMeal.save();
        console.log('Meal saved successfully with ID:', savedMeal._id);

        res.status(201).json({ 
            success: true, 
            message: 'Meal logged successfully',
            mealId: savedMeal._id,
            data: {
                id: savedMeal._id,
                title: savedMeal.title,
                mealType: savedMeal.mealType,
                servings: savedMeal.servings,
                date: savedMeal.date
            }
        });

    } catch (error) {
        console.error('Error logging meal:', error);
        console.error('Error stack:', error.stack);
        
        // Handle MongoDB validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false,
                error: `Validation error: ${validationErrors.join(', ')}` 
            });
        }

        // Handle MongoDB duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Duplicate entry detected' 
            });
        }

        res.status(500).json({ 
            success: false,
            error: 'Failed to log meal: ' + error.message 
        });
    }
};

const getMealsForDate = async (req, res) => {
    try {
        const { date } = req.query;
        
        console.log('=== Get Meals Debug ===');
        console.log('Session userId:', req.session.userId);
        console.log('Requested date:', date);

        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false,
                error: 'User not logged in' 
            });
        }

        if (!date) {
            return res.status(400).json({ 
                success: false,
                error: 'Date is required' 
            });
        }

        // Validate date format
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid date format' 
            });
        }

        // Parse date and create date range for the entire day
        const startDate = new Date(date + 'T00:00:00.000Z');
        const endDate = new Date(date + 'T23:59:59.999Z');

        console.log('Date range:', { startDate, endDate });

        const loggedMeals = await LoggedMeal.find({
            userId: new mongoose.Types.ObjectId(req.session.userId),
            date: {
                $gte: startDate,
                $lt: endDate
            }
        }).sort({ createdAt: -1 });

        console.log(`Found ${loggedMeals.length} meals for date ${date}`);

        // Group meals by type
        const mealsByType = {
            breakfast: [],
            lunch: [],
            dinner: []
        };

        loggedMeals.forEach(meal => {
            if (mealsByType[meal.mealType]) {
                const totalNutrition = {
                    calories: Math.round(meal.nutrition.calories * meal.servings),
                    carbs: Math.round(meal.nutrition.carbs * meal.servings),
                    fat: Math.round(meal.nutrition.fat * meal.servings),
                    protein: Math.round(meal.nutrition.protein * meal.servings)
                };

                mealsByType[meal.mealType].push({
                    id: meal._id,
                    title: meal.title,
                    image: meal.image,
                    nutrition: meal.nutrition,
                    servings: meal.servings,
                    totalNutrition: totalNutrition
                });
            }
        });

        // Calculate daily totals
        const dailyTotals = {
            calories: 0,
            carbs: 0,
            fat: 0,
            protein: 0
        };

        loggedMeals.forEach(meal => {
            dailyTotals.calories += meal.nutrition.calories * meal.servings;
            dailyTotals.carbs += meal.nutrition.carbs * meal.servings;
            dailyTotals.fat += meal.nutrition.fat * meal.servings;
            dailyTotals.protein += meal.nutrition.protein * meal.servings;
        });

        // Round totals
        Object.keys(dailyTotals).forEach(key => {
            dailyTotals[key] = Math.round(dailyTotals[key]);
        });

        console.log('Daily totals:', dailyTotals);

        res.json({
            success: true,
            meals: mealsByType,
            dailyTotals,
            totalMeals: loggedMeals.length
        });

    } catch (error) {
        console.error('Error fetching meals for date:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch meals: ' + error.message 
        });
    }
};

const deleteMeal = async (req, res) => {
    try {
        const { mealId } = req.params;
        
        console.log('=== Delete Meal Debug ===');
        console.log('Session userId:', req.session.userId);
        console.log('Meal ID to delete:', mealId);

        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false,
                error: 'User not logged in' 
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(mealId)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid meal ID format' 
            });
        }

        // Find and delete the meal, ensuring it belongs to the current user
        const deletedMeal = await LoggedMeal.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(mealId),
            userId: new mongoose.Types.ObjectId(req.session.userId)
        });

        if (!deletedMeal) {
            console.log('Meal not found or not authorized');
            return res.status(404).json({ 
                success: false,
                error: 'Meal not found or not authorized' 
            });
        }

        console.log('Meal deleted successfully:', deletedMeal._id);

        res.json({ 
            success: true, 
            message: 'Meal deleted successfully',
            deletedMeal: {
                id: deletedMeal._id,
                title: deletedMeal.title,
                nutrition: deletedMeal.nutrition,
                servings: deletedMeal.servings
            }
        });

    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete meal: ' + error.message 
        });
    }
};

const updateMeal = async (req, res) => {
    try {
        const { mealId } = req.params;
        const { servings } = req.body;
        
        console.log('=== Update Meal Debug ===');
        console.log('Session userId:', req.session.userId);
        console.log('Meal ID to update:', mealId);
        console.log('New servings:', servings);

        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false,
                error: 'User not logged in' 
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(mealId)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid meal ID format' 
            });
        }

        const servingsNum = parseFloat(servings);
        if (!servings || isNaN(servingsNum) || servingsNum <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Valid servings amount is required' 
            });
        }

        // Find and update the meal, ensuring it belongs to the current user
        const updatedMeal = await LoggedMeal.findOneAndUpdate(
            {
                _id: new mongoose.Types.ObjectId(mealId),
                userId: new mongoose.Types.ObjectId(req.session.userId)
            },
            { servings: servingsNum },
            { new: true, runValidators: true }
        );

        if (!updatedMeal) {
            console.log('Meal not found or not authorized for update');
            return res.status(404).json({ 
                success: false,
                error: 'Meal not found or not authorized' 
            });
        }

        console.log('Meal updated successfully:', updatedMeal._id);

        res.json({ 
            success: true, 
            message: 'Meal updated successfully',
            updatedMeal: {
                id: updatedMeal._id,
                servings: updatedMeal.servings,
                nutrition: updatedMeal.nutrition,
                title: updatedMeal.title
            }
        });

    } catch (error) {
        console.error('Error updating meal:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update meal: ' + error.message 
        });
    }
};

module.exports = { 
    getMealLogging, 
    logMeal, 
    getMealsForDate, 
    deleteMeal, 
    updateMeal 
};