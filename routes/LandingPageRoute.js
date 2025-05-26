const express = require("express");
const router = express.Router();
const LandingPageController = require("../controllers/LandingPageController");

router.get("/", LandingPageController.getLandingPage);

module.exports = router;