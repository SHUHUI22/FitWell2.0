const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');
const Users = require('../models/Users');
const getCurrentUserEmail = (req) => req.session.email || "yanjie0910@gmail.com";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Render Create Reminder page, with currentTab for UI tab highlight
exports.showCreateForm = (req, res) => {
  res.render('CreateReminder', { currentTab: 'create' });
};

exports.showListPage = async (req, res) => {
  try {
    const userEmail = getCurrentUserEmail(req);
    const reminders = await Reminder.find({ userEmail });

    res.render('MyReminder', {
      reminders,
      currentTab: 'my‑reminders',
      successMessage: req.session.successMessage || null,
    });
    // Clear the flash message after rendering once
    req.session.successMessage = null;
  } catch (error) {
    res.render('MyReminder', {
      reminders: [],
      currentTab: 'my‑reminders',
      successMessage: null,
      errorMessage: error.message,
    });
  }
};

  exports.createReminder = async (req, res) => {
  try {
    const userEmail = req.session.email;

    // Persist reminder
    const reminder = new Reminder({ ...req.body, userEmail });
    await reminder.save();

    // Fetch notification settings
    const user = await Users.findOne({ email: userEmail });
    const category = reminder.category;
    const isNotificationEnabled = user?.notification?.[category];

    if (isNotificationEnabled) {
      const mailOptions = {
        from: `"FitWell App" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Ding ding! Time for your FitWell Mission',
        text: `You created a new reminder:\n\nTitle: ${reminder.title}\nCategory: ${reminder.category}\nDate: ${reminder.date}\nTime: ${reminder.time}\nRepeat: ${reminder.repeat}`,
      };
    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
   }
    } else {
      console.log(`Notification for ${category} is disabled; no email sent.`);
    }

    // Flash success message & redirect
    req.session.successMessage = 'Reminder created successfully!';
    res.redirect('/FitWell/reminders/my-reminders');
  } catch (error) {
    console.error('Reminder creation error:', error);
    res.render('CreateReminder', {
      currentTab: 'create',
      successMessage: null,
      errorMessage: error.message,
    });
  }
};
// Update reminder without login session
exports.updateReminder = async (req, res) => {
  try {
    const userEmail = req.session.email;
    const { id } = req.params;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userEmail },
      req.body,
      { new: true },
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder updated successfully', reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.deleteReminder = async (req, res) => {
  try {
    const userEmail = req.session.email;
    const { id } = req.params;

    const result = await Reminder.findOneAndDelete({ _id: id, userEmail });

    if (!result) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
