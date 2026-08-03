require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

bot.sendMessage('958013131', 'Test').then(msg => {
  console.log('Sent msg:', msg.message_id);
}).catch(console.error);
