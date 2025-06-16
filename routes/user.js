const express = require("express");
const router = express.Router();
const Users = require("../models/Users"); 

router.get("/bmi", async (req, res) => {
    try {
        const userId = req.session.userId || req.user?.id; 
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const user = await Users.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const heightInMeters = user.height / 100;
        const bmi = user.weight / (heightInMeters * heightInMeters);

        res.json({ bmi: parseFloat(bmi.toFixed(1)) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
