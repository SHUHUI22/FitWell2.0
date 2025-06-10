const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Users = require("../models/Users");

async function getSignUpPage(req, res) {
    res.render("SignUp");
}

async function getLoginPage(req, res) {
    res.render("Login");
}

async function getForgotPasswordPage(req, res) {
    res.render("ForgotPassword");
}

async function signUpUser(req, res) {
    try {
        // Get data from the form
        const {
            username,
            email,
            password,
            age,
            height,
            weight,
            targetWeight,
            gender
        } = req.body;

        // Check if user already exists
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.redirect("/FitWell/SignUp?error=exists");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new Users({
            username,
            email,
            password: hashedPassword,
            age,
            height,
            weight,
            targetWeight,
            gender,
            weightHistory: 
            [{
                weight: weight,
                date: new Date()
            }]
        });

        await newUser.save();

        res.redirect("/FitWell/Login");
    }

    catch (error) {
        console.log(error);
        res.status(500).send("Server error");
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email });

        if (!user) {
            return res.redirect("/FitWell/Login?error=usernotfound");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.redirect("/FitWell/Login?error=wrongpassword");
        }

        req.session.userId = user._id;
        req.session.username = user.username;

        return res.redirect("/FitWell");
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Server error");
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await Users.findOne({ email });
        if (!user) {
            return res.redirect("/FitWell/ForgotPassword?error=usernotfound");
        }

        // Generate reset token and expiry 
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Save token and expiry in user document
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Create reset link
        const resetLink = `http://${req.headers.host}/FitWell/ResetPassword/${resetToken}`;

        // Configure nodemailer transporter (replace with your email credentials)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "usersh22sh@gmail.com",
                pass: "lzux cbxf dpoj pqlw",
            },
        });

        // Email options
        const mailOptions = {
            to: user.email,
            from: "no-reply@fitwell.com",
            subject: "FitWell Password Reset",
            text: `You requested a password reset.\n\nPlease click the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 5 minutes.`,
        };

        // Send email
        await transporter.sendMail(mailOptions);
        return res.redirect("/FitWell/ForgotPassword?success=resetSent");
    } catch (error) {
        res.status(500).send("Error sending reset link.");
    }
}

async function getResetPasswordPage(req, res) {
    const { token } = req.params;

    try {
        const user = await Users.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.redirect("/FitWell/ForgotPassword?error=expired");
        }

        return res.render("ResetPassword", { token }); // Show reset form
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
}

async function resetPassword(req, res) {
    const { token, password } = req.body;

    try {
        const user = await Users.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            res.redirect("/FitWell/ForgotPassword?error=expired");
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear token
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        return res.redirect("/FitWell/ForgotPassword?success=resetSuccess");
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to reset password.");
    }
}


async function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.log(error);
            return res.status(500).send("Logout failed");
        }
        res.clearCookie("connect.sid"); // default session cookie
        res.redirect("/FitWell/Login");
    })
}


module.exports = { getSignUpPage, getLoginPage, getForgotPasswordPage, getResetPasswordPage, signUpUser, loginUser, forgotPassword, resetPassword, logout };