const FavouriteMeal = require('../models/FavouriteMeal'); // Make sure this path is correct

// Get all favourite meals for a user
const getFavourites = async (req, res) => {
    try {
        console.log('getFavourites called');
        console.log('Session:', req.session);
        console.log('UserId:', req.session.userId);
        
        const userId = req.session.userId;
        
        if (!userId) {
            console.log('User not logged in');
            return res.status(401).json({ error: 'User not logged in' });
        }

        console.log('Fetching favourites for userId:', userId);
        const favourites = await FavouriteMeal.find({ userId }).sort({ createdAt: -1 });
        console.log('Found favourites:', favourites.length);
        
        res.json(favourites);
    } catch (error) {
        console.error('Error fetching favourites:', error);
        res.status(500).json({ error: 'Failed to fetch favourites', details: error.message });
    }
};

// Add a meal to favourites
const addToFavourites = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        const { mealId, mealName, mealImage, calories, protein, fat, carbs } = req.body;

        // Check if meal is already in favourites
        const existingFavourite = await FavouriteMeal.findOne({ userId, mealId });
        
        if (existingFavourite) {
            return res.status(400).json({ error: 'Meal already in favourites' });
        }

        // Create new favourite meal
        const newFavourite = new FavouriteMeal({
            userId,
            mealId,
            mealName,
            mealImage,
            calories: parseFloat(calories) || 0,
            protein: parseFloat(protein) || 0,
            fat: parseFloat(fat) || 0,
            carbs: parseFloat(carbs) || 0
        });

        await newFavourite.save();
        res.status(201).json({ message: 'Meal added to favourites', favourite: newFavourite });
    } catch (error) {
        console.error('Error adding to favourites:', error);
        if (error.code === 11000) { // Duplicate key error
            res.status(400).json({ error: 'Meal already in favourites' });
        } else {
            res.status(500).json({ error: 'Failed to add meal to favourites' });
        }
    }
};

// Remove a meal from favourites
const removeFromFavourites = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { mealId } = req.params;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        const deletedFavourite = await FavouriteMeal.findOneAndDelete({ userId, mealId });
        
        if (!deletedFavourite) {
            return res.status(404).json({ error: 'Favourite meal not found' });
        }

        res.json({ message: 'Meal removed from favourites' });
    } catch (error) {
        console.error('Error removing from favourites:', error);
        res.status(500).json({ error: 'Failed to remove meal from favourites' });
    }
};

// Check if a meal is in favourites
const checkFavouriteStatus = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { mealId } = req.params;
        
        if (!userId) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        const favourite = await FavouriteMeal.findOne({ userId, mealId });
        res.json({ isFavourite: !!favourite });
    } catch (error) {
        console.error('Error checking favourite status:', error);
        res.status(500).json({ error: 'Failed to check favourite status' });
    }
};

module.exports = {
    getFavourites,
    addToFavourites,
    removeFromFavourites,
    checkFavouriteStatus
};