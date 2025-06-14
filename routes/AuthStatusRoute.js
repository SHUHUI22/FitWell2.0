const express = require('express');
const router = express.Router();

// GET authentication status (API endpoint for AJAX calls)
// This will be accessible at /FitWell/api/auth/status
router.get('/api/auth/status', (req, res) => {
    const isLoggedIn = !!req.session.userId;
    res.json({ 
        isLoggedIn,
        userId: req.session.userId || null
    });
});

module.exports = router;