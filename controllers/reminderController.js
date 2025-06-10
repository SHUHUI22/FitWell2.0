const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');
const Reminder = require('../models/Reminder');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  secure: true,
  auth: {
    user:'yanjie0910@gmail.com',
    pass:'vcji pzjn usrz jlxl'
  }
});

// Render Create Reminder page, with currentTab for UI tab highlight
exports.showCreateForm = (req, res) => {
  res.render('CreateReminder', { currentTab: 'create' });
};

exports.showListPage = async (req, res) => {
  try {
     const reminders = await Reminder.find();

   res.render('MyReminder', { 
      reminders: reminders, 
      currentTab: 'my-reminders',
      successMessage: req.session.successMessage || null
    });
    
    // Clear success message after displaying
    if (req.session.successMessage) {
      req.session.successMessage = null;
    }
    req.session.successMessage = null; 
  } catch (error) {
    // Still render the page even if there's an error, just with empty reminders
    res.render('MyReminder', { 
      reminders: [], 
      currentTab: 'my-reminders',
      successMessage: null 
    });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const userEmail = 'yanjie0910@gmail.com'; // fallback user

    const reminder = new Reminder({
      ...req.body,
      userEmail
    });

    await reminder.save();

    // send email
    const mailOptions = {
      from: '"FitWell App" <yanjie0910@gmail.com>',
      to: 'yanjie0910@gmail.com',
      subject: 'Ding ding! Time for your FitWell Mission',
      text: `You created a new reminder:\n\nTitle: ${reminder.title}\nCategory: ${reminder.category}\nDate: ${reminder.date}\nTime: ${reminder.time}\nRepeat: ${reminder.repeat}`
    };
    transporter.sendMail(mailOptions);

    // Store success message in session
    req.session.successMessage = 'Reminder created successfully!';

    // Redirect to reminder list page
    res.redirect('/FitWell/reminders/my-reminders');

  } catch (error) {
    res.render('CreateReminder', { 
      currentTab: 'create',
      successMessage: null,
      errorMessage: error.message 
    });
  }
};

// Update reminder without login session
exports.updateReminder = async (req, res) => {
  try {
    const userEmail = 'yanjie0910@gmail.com'; // Static fallback email

    const { id } = req.params;
    const updateData = req.body;

    const reminder = await Reminder.findOneAndUpdate(
      { _id: id, userEmail },
      updateData,
      { new: true }
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
    const { id } = req.params;
    const userEmail = 'yanjie0910@gmail.com';

    const result = await Reminder.findOneAndDelete({ _id: id, userEmail });

    if (!result) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

