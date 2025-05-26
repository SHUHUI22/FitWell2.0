const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// GET routes
router.get("/Login", authController.getLoginPage);
router.get("/SignUp", authController.getSignUpPage);
router.get("/Logout", authController.logout);
router.get("/ForgotPassword", authController.getForgotPasswordPage);
router.get("/ResetPassword/:token", authController.getResetPasswordPage);

// POST routes
router.post("/Login",authController.loginUser);
router.post("/SignUp",authController.signUpUser);
router.post("/ForgotPassword",authController.forgotPassword);
router.post("/ResetPassword", authController.resetPassword);

module.exports = router;