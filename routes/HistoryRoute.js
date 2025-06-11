const express = require("express");
const router = express.Router();
const HistoryController = require("../controllers/HistoryController");

// GET routes
router.get("/activities", HistoryController.getActivityHistory);

// PUT 
router.put('/activities/:id', HistoryController.updateActivity);
router.delete('/activities/:id', HistoryController.deleteActivity);

module.exports = router;