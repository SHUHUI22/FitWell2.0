const express = require("express");
const router = express.Router();
const HistoryController = require("../controllers/HistoryController");

// GET routes
router.get("/history", HistoryController.getActivityHistory);

module.exports = router;