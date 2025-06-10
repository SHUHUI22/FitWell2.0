const Users = require('../models/Users');

async function getProfile(req, res) {
    try {
        const userId = req.session.userId;

        const user = await Users.findById(userId).select("-password");

        const alertMessage = req.query.alert;
        const passwordChangedSuccess = req.session.passwordChangedSuccess;
        const passwordError = req.session.passwordError;

        delete req.session.passwordChangedSuccess;
        delete req.session.passwordError;

        res.render("Profile", {
            user,
            notificationSettings: user.notification,
            alertMessage,
            passwordChangedSuccess,
            passwordError,
        });
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).render("error", { message: "Server error" });
    }
}


async function toggleNotification(req, res) {
    try {
        const { category, isNotificationEnabled } = req.body;
        const userId = req.session.userId;

        // Update the user's notification preference
        await Users.findByIdAndUpdate(
            userId,
            { $set: { [`notification.${category}`]: isNotificationEnabled } },
            { new: true }
        );

        return res.status(200).json({ message: "Notification updated successfully" });
    } catch (err) {
        console.error("Error toggling notification:", err);
        return res.status(500).json({ message: "Server error while updating notification" });
    }
}


const bcrypt = require("bcrypt");

async function changePassword(req, res) {
    try {
        const userId = req.session.userId;
        const { currentPassword, newPassword } = req.body;

        const user = await Users.findById(userId);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
       if (!isMatch) {
        req.session.passwordError = "Current password is incorrect.";
        return res.redirect("/FitWell/Profile");
      }


        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await Users.findByIdAndUpdate(userId, {
            password: hashedPassword
        });


        req.session.passwordChangedSuccess = true;
        return res.redirect("/FitWell/Profile");


    } catch (err) {
        res.status(500).send("error", { message: "Server error during password change." });
    }
}

const path = require("path");

async function updateProfile(req, res) {
    try {
        const userId = req.session.userId;
        const user = await Users.findOne({ _id: userId });

        const newWeight = Number(req.body.weight);

        // Only log weight history if weight changed
        if (newWeight !== user.weight) {
            user.weightHistory.push({
                weight: newWeight,
                date: new Date()
            });
            user.weight = newWeight; // also update current weight
        }

        // Update other fields
        user.username = req.body.username;
        user.age = req.body.age;
        user.gender = req.body.gender;
        user.height = req.body.height;
        user.targetWeight = req.body.targetWeight;

        if (req.file) {
            user.profilePic = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        await user.save(); // saves everything, including weightHistory

        res.redirect("/FitWell/Profile");

    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).send("Server error");
    }
}



async function deleteAccount(req, res) {
  try {
    const userId = req.session.userId;

    await Users.findByIdAndDelete(userId);

     req.session.destroy((err) => {
        if (err) {
            console.log(error);
            return res.status(500).send("Logout failed");
        }
        res.clearCookie("connect.sid");
        res.redirect("/FitWell");
    })

  } catch (err) {
    console.error("Delete account error:", err);
    return res.status(500).render("error", { message: "Server error during account deletion." });
  }
}

module.exports = { getProfile, toggleNotification, updateProfile, changePassword, deleteAccount };