const express = require("express");
const router = express.Router();
const ProgressChartController = require("../controllers/ProgressChartController");

router.get("/ProgressChart", ProgressChartController.getProgressChart);

module.exports = router;