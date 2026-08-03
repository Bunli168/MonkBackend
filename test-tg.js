require('dotenv').config();
const telegramBot = require('./services/telegramBot');
const message = `🔔 *Test Message*\nThis is a test notification for Super Admin.`;
telegramBot.sendMessage('958013131', message, { parse_mode: 'Markdown' })
    .then(() => console.log('Message sent successfully!'))
    .catch(err => console.error('Failed to send:', err));
