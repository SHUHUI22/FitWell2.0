const express = require("express");
const router = express.Router();
const ProfileController = require("../controllers/ProfileController");
const upload = require("../middlewares/upload");

// GET
router.get("/Profile", ProfileController.getProfile);

// POST with file upload
router.post("/Profile", upload.single("profilePic"), ProfileController.updateProfile);

// POST change password
router.post("/changePassword", ProfileController.changePassword);


//POST delete account
router.post("/Profile/DeleteAccount", ProfileController.deleteAccount);

router.post("/toggleNotification", ProfileController.toggleNotification);

module.exports = router;
