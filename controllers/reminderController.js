const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Users = require('../models/Users');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "usersh22sh@gmail.com",
    pass: "lzux cbxf dpoj pqlw"
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

    const reminder = new Reminder({
      ...req.body,
      date: new Date(`${req.body.date}T00:00:00.000Z`),
      userId: req.session.userId
    });
    await reminder.save();

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

// 🔁 CRON JOB: Check reminders every minute and send emails
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDateStr = now.toISOString().split('T')[0];
  try {
    const reminders = await Reminder.find({});
    for (const reminder of reminders) {
      const reminderDate = new Date(reminder.date);
      const [hour, minute] = reminder.time.split(':').map(Number);
      const isSameDay = reminderDate.toISOString().split('T')[0] === currentDateStr;
      const isSameTime = hour === currentHour && minute === currentMinute;
      if (isSameDay && isSameTime) {
        const user = await Users.findById(reminder.userId);
        if (!user) continue;
        const isNotificationEnabled = user?.notification?.[reminder.category];
        if (!isNotificationEnabled) continue;
        const mailOptions = {
          from: "FitWell <usersh22sh@gmail.com>",
          to: user.email,
          subject: '⏰ Ding ding! Time for your FitWell mission!',
          text: `Reminder:\n\nTitle: ${reminder.title}\nCategory: ${reminder.category}\nRepeat: ${reminder.repeat}`
        };
        try {
          await transporter.sendMail(mailOptions);
          console.log(`Reminder email sent to ${user.email}`);
        } catch (err) {
          console.error(`Failed to send email to ${user.email}:`, err);
        }
        // Handle repeat
        if (reminder.repeat === 'daily') {
          reminder.date.setDate(reminder.date.getDate() + 1);
          reminder.markModified('date'); // tell Mongoose this field changed
          await reminder.save();
        } else if (reminder.repeat === 'weekly') {
          reminder.date.setDate(reminder.date.getDate() + 7);
          reminder.markModified('date'); // tell Mongoose this field changed
          await reminder.save();
        } else if (reminder.repeat === 'monthly') {
          reminder.date.setMonth(reminder.date.getMonth() + 1);
          reminder.markModified('date'); // tell Mongoose this field changed
          await reminder.save();
        }
        // No action for 'none'
      }
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
});

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
    
    // req.body.date = userDate;
    req.body.date = new Date(`${req.body.date}T00:00:00.000Z`);
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
