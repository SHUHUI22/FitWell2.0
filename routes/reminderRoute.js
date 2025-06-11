const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.get('/reminders/create', reminderController.showCreateForm);
router.get('/reminders/my-reminders', reminderController.showListPage);
router.post('/reminders/create', reminderController.createReminder);
router.put('/reminders/:id', reminderController.updateReminder);
router.delete('/reminders/:id', reminderController.deleteReminder);

module.exports = router;