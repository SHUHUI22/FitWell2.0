const express = require("express");
const router = express.Router();
const HistoryController = require("../controllers/HistoryController");

// GET routes
router.get("/Activities", HistoryController.getActivityHistory);

// PUT 
router.put('/Activities/:id', HistoryController.updateActivity);
router.delete('/Activities/:id', HistoryController.deleteActivity);

module.exports = router;