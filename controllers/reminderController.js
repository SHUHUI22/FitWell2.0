const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');
const Users = require('../models/Users');

// Helper: Get user email by session ID
const getCurrentUserEmail = async (req) => {
  if (!req.session.userId) throw new Error('User not logged in');
  const user = await Users.findById(req.session.userId);
  if (!user) throw new Error('User not found');
  return user.email;
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.showCreateForm = (req, res) => {
  if (!req.session.userId) return res.redirect('/FitWell/Login');
  res.render('CreateReminder', { currentTab: 'create' });
};

exports.showListPage = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/FitWell/Login');
    const reminders = await Reminder.find({ userId: req.session.userId });

    res.render('MyReminder', {
      reminders,
      currentTab: 'my-reminders',
      successMessage: req.session.successMessage || null,
    });

    req.session.successMessage = null;
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.render('MyReminder', {
      reminders: [],
      currentTab: 'my-reminders',
      successMessage: null,
      errorMessage: error.message,
    });
  }
};

exports.createReminder = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/FitWell/Login');

    const userEmail = await getCurrentUserEmail(req);

    const reminder = new Reminder({
      ...req.body,
      userId: req.session.userId
    });
    await reminder.save();

    // Send email if user has notifications enabled
    const user = await Users.findById(req.session.userId);
    const isNotificationEnabled = user?.notification?.[reminder.category];

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
    }

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

exports.updateReminder = async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'User not logged in' });
    const { id } = req.params;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId: req.session.userId },
      req.body,
      { new: true }
    );

    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    res.json({ message: 'Reminder updated successfully', reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ message: 'User not logged in' });
    const { id } = req.params;

    const result = await Reminder.findOneAndDelete({ _id: id, userId: req.session.userId });

    if (!result) return res.status(404).json({ message: 'Reminder not found' });

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: error.message });
  }
};
