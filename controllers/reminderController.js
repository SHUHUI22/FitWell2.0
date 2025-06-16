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

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Get today's date in YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Render create reminder form
exports.showCreateForm = (req, res) => {
  if (!req.session.userId) return res.redirect('/FitWell/Login');

  res.render('CreateReminder', {
    currentTab: 'create',
    today: getTodayDate(),
    successMessage: null,
    errorMessage: null
  });
};

// Render reminder list page
exports.showListPage = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/FitWell/Login');

    const reminders = await Reminder.find({ userId: req.session.userId });

    const formattedReminders = reminders.map(r => {
      const dateObj = new Date(r.date);

      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;

      const capitalizedRepeat =
        r.repeat === 'none' ? 'Once' : r.repeat.charAt(0).toUpperCase() + r.repeat.slice(1);

      return {
        ...r.toObject(),
        formattedDate,
        capitalizedRepeat
      };
    });

    res.render('MyReminder', {
      reminders: formattedReminders,
      currentTab: 'my-reminders',
      today: getTodayDate(),
      successMessage: req.session.successMessage || null,
    });

    req.session.successMessage = null;
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.render('MyReminder', {
      reminders: [],
      currentTab: 'my-reminders',
      today: getTodayDate(),
      successMessage: null,
      errorMessage: error.message,
    });
  }
};

// Create reminder
exports.createReminder = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect('/FitWell/Login');

    const { date } = req.body;
    const userDate = new Date(date);
    const currentDate = new Date();
    userDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (userDate < currentDate) {
      return res.render('CreateReminder', {
        currentTab: 'create',
        today: getTodayDate(),
        successMessage: null,
        errorMessage: 'Date cannot be in the past.'
      });
    }

    const userEmail = await getCurrentUserEmail(req);

    const reminder = new Reminder({
      ...req.body,
      date: new Date(`${req.body.date}T00:00:00.000Z`),
      userId: req.session.userId
    });
    await reminder.save();

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
      today: getTodayDate(),
      successMessage: null,
      errorMessage: error.message,
    });
  }
};

// Update reminder
exports.updateReminder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'User not logged in' });
    }

    const { id } = req.params;
    const { date } = req.body;

    const userDate = new Date(date);
    const currentDate = new Date();
    userDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (userDate < currentDate) {
      return res.status(400).json({ message: 'Date cannot be in the past' });
    }

    req.body.date = userDate;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userId: req.session.userId },
      req.body,
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder updated successfully', reminder });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete reminder
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

