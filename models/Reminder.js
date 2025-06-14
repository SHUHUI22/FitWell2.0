const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['workout', 'nutrition', 'water']
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: String, // or use Date if preferred
    required: true
  },
  time: {
    type: String,
    required: true
  },
  repeat: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', reminderSchema);