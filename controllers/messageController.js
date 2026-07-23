const messageService = require('../services/messageService');

const messageController = {
  // Send a message
  async send(req, res) {
    try {
      const senderId = req.user.id;
      const message = await messageService.sendMessage(senderId, req.body);
      res.status(201).json({ success: true, message: 'Message sent', data: message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Get inbox
  async getInbox(req, res) {
    try {
      const userId = req.user.id;
      const messages = await messageService.getUserInbox(userId);
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get sent messages
  async getSent(req, res) {
    try {
      const userId = req.user.id;
      const messages = await messageService.getUserSentMessages(userId);
      res.status(200).json({ success: true, data: messages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Mark message as read
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const result = await messageService.markMessageAsRead(id, userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = messageController;
