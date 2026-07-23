const { Message, MessageRecipient, User, UserProfile } = require('../models');

const messageService = {
  async sendMessage(senderId, messageData) {
    const { subject, body, is_broadcast, receiver_ids } = messageData;
    
    if (!subject || !body) {
      throw new Error('Subject and body are required');
    }

    const message = await Message.create({
      sender_id: senderId,
      subject,
      body,
      is_broadcast: is_broadcast || false
    });

    if (is_broadcast) {
      const allUsers = await User.findAll();
      const otherUsers = allUsers.filter(u => u.id !== senderId);
      
      const recipients = otherUsers.map(user => ({
        message_id: message.id,
        receiver_id: user.id
      }));
      await MessageRecipient.bulkCreate(recipients);

      try {
        const { emitToAll } = require('../config/socket');
        emitToAll('new_message', message);
      } catch (e) {}
    } else {
      if (!receiver_ids || !Array.isArray(receiver_ids) || receiver_ids.length === 0) {
        throw new Error('receiver_ids array is required for non-broadcast messages');
      }

      const recipients = receiver_ids.map(receiverId => ({
        message_id: message.id,
        receiver_id: receiverId
      }));
      await MessageRecipient.bulkCreate(recipients);

      try {
        const { emitToUser } = require('../config/socket');
        receiver_ids.forEach(id => {
          emitToUser(id, 'new_message', message);
        });
      } catch (e) {}
    }

    return message;
  },

  async getUserInbox(userId) {
    const recipients = await MessageRecipient.findAll({
      where: { receiver_id: userId },
      include: [{
        model: Message,
        include: [{ 
          model: User, 
          attributes: ['email'],
          include: [{ model: UserProfile, attributes: ['first_name_en', 'last_name_en', 'first_name_kh', 'last_name_kh', 'avatar_url'] }]
        }]
      }],
      order: [[Message, 'sent_at', 'DESC']]
    });
    return recipients;
  },

  async getUserSentMessages(userId) {
    const messages = await Message.findAll({
      where: { sender_id: userId },
      include: [{ model: MessageRecipient }],
      order: [['sent_at', 'DESC']]
    });
    return messages;
  },

  async markMessageAsRead(messageId, userId) {
    const [updatedCount] = await MessageRecipient.update(
      { is_read: true, read_at: new Date() },
      { where: { message_id: messageId, receiver_id: userId } }
    );
    if (updatedCount === 0) {
      throw new Error('Message not found in your inbox');
    }
    return { message: 'Message marked as read' };
  }
};

module.exports = messageService;