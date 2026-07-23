const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// All message routes require authentication
router.use(authenticate);

// Send message
router.post('/', messageController.send);

// Get inbox and sent messages
router.get('/inbox', messageController.getInbox);
router.get('/sent', messageController.getSent);

// Mark as read
router.patch('/:id/read', messageController.markAsRead);

module.exports = router;
