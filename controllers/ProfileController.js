const Users = require('../models/Users');

async function getProfile(req, res) {
    try {
      
        const userId = req.session.userId;

        const user = await Users.findById(userId).select("-password");

        const alertMessage = req.query.alert;

        const passwordChangedSuccess = req.session.passwordChangedSuccess;
        const passwordError = req.session.passwordError;

        // Clear immediately
        delete req.session.passwordChangedSuccess;
        delete req.session.passwordError;

        res.render("Profile", {
            user,
            alertMessage,
            passwordChangedSuccess,
            passwordError
        });

      
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).render("error", { message: "Server error" });
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

        const updatedData = {
            username: req.body.username,
            age: req.body.age,
            gender: req.body.gender,
            height: req.body.height,
            weight: req.body.weight,
            targetWeight: req.body.targetWeight
        };

        if (req.file) {
            updatedData.profilePic = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        await Users.findByIdAndUpdate(userId, updatedData);

        res.redirect("/FitWell/Profile");

    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).render("error", { message: "Server error" });
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

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };