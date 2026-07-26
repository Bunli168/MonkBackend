const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const { User, UserProfile, Role } = require('../models');

const token = process.env.TELEGRAM_MEMBER_BOT_TOKEN;
let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: true });

    bot.getMe().then((me) => {
        console.log(`✅ NEW MEMBER BOT INITIALIZED! Username: @${me.username} | Link: https://t.me/${me.username}`);
    }).catch(err => console.log('Could not fetch bot info:', err.message));

    console.log('New Member Telegram bot initialized and polling...');

    async function handleAutoLink(chatId, queryStr, username) {
        try {
            if (!queryStr) return false;
            let norm = queryStr.trim();
            if (norm.startsWith('+855')) norm = '0' + norm.slice(4);
            else if (norm.startsWith('855') && norm.length > 9) norm = '0' + norm.slice(3);

            let userProfile = await UserProfile.findOne({ where: { phone_number: norm } });
            let user = null;
            if (userProfile) {
                user = await User.findByPk(userProfile.user_id);
            } else {
                user = await User.findOne({ where: { email: norm } }) || await User.findOne({ where: { phone: norm } });
            }

            if (!user) {
                return false;
            }

            // Verify role: only Super Admin and Admin can link
            if (!user.Role && Role) {
                user = await User.findByPk(user.id, { include: [Role] });
            }
            const roleName = user.Role ? user.Role.name.toLowerCase() : '';
            const isAdminRole = user.role_id === 1 || user.role_id === 2 || ['admin', 'super_admin'].includes(roleName);
            if (!isAdminRole) {
                bot.sendMessage(chatId, `⛔ *សិទ្ធិមិនគ្រប់គ្រាន់ (Access Denied)*\n\nសូមអភ័យទោស! Bot នេះត្រូវបានកំណត់សម្រាប់តែ **Admin** និង **Super Admin** ប៉ុណ្ណោះក្នុងការភ្ជាប់។ គណនីរបស់អ្នកមិនមានសិទ្ធិទេ។`, { parse_mode: 'Markdown' });
                return false;
            }

            user.telegram_chat_id = chatId.toString();
            user.telegram_username = username || null;
            await user.save();

            if (!userProfile) {
                userProfile = await UserProfile.findOne({ where: { user_id: user.id } });
            }

            const nameStr = userProfile ? `${userProfile.first_name_kh} ${userProfile.last_name_kh}` : user.email;
            bot.sendMessage(chatId, `✅ *ភ្ជាប់គណនីជោគជ័យ! (Account Linked Successfully!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${user.email}\n\nចាប់ពីពេលនេះតទៅ លោកអ្នកនឹងទទួលបានសារ Alert រាល់ពេលមានសមាជិកថ្មីចុះឈ្មោះ! 🎉`, { 
                parse_mode: 'Markdown',
                reply_markup: { remove_keyboard: true }
            });
            return true;
        } catch (error) {
            console.error('Error in handleAutoLink:', error);
            return false;
        }
    }

    bot.on('message', async (msg) => {
        if (msg.contact && msg.contact.phone_number) {
            const linked = await handleAutoLink(msg.chat.id, msg.contact.phone_number, msg.from.username);
            if (!linked) {
                bot.sendMessage(msg.chat.id, `❌ *រកមិនឃើញគណនីក្នុងប្រព័ន្ធ ឬគ្មានសិទ្ធិជា Admin*\nសូមត្រួតពិនិត្យលេខទូរស័ព្ទក្នុង Profile របស់អ្នក ឬទាក់ទង Super Admin។`, { parse_mode: 'Markdown' });
            }
            return;
        }

        if (msg.text && !msg.text.startsWith('/')) {
            const text = msg.text.trim();
            if (/^(\+?855|0)\d{7,9}$/.test(text) || /\S+@\S+\.\S+/.test(text)) {
                const linked = await handleAutoLink(msg.chat.id, text, msg.from.username);
                if (!linked) {
                    bot.sendMessage(msg.chat.id, `❌ *រកមិនឃើញគណនី ឬគ្មានសិទ្ធិជា Admin សម្រាប់ "${text}" ទេ*\nសូមត្រួតពិនិត្យលេខទូរស័ព្ទ ឬអ៊ីមែលរបស់អ្នកឡើងវិញ។`, { parse_mode: 'Markdown' });
                }
            }
        }
    });

    bot.on('polling_error', (error) => {
        console.log('BOT POLLING ERROR:', error);
    });

    // /start command with auto detection and 1-click contact button
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const payload = match[1];

        if (payload) {
            const linked = await handleAutoLink(chatId, payload, msg.from.username);
            if (linked) return;
        }

        // Check if already linked
        const existingUser = await User.findOne({ where: { telegram_chat_id: chatId.toString() }, include: [Role] });
        if (existingUser) {
            const roleName = existingUser.Role ? existingUser.Role.name.toLowerCase() : '';
            const isAdminRole = existingUser.role_id === 1 || existingUser.role_id === 2 || ['admin', 'super_admin'].includes(roleName);
            if (!isAdminRole) {
                existingUser.telegram_chat_id = null;
                existingUser.telegram_username = null;
                await existingUser.save();
                return bot.sendMessage(chatId, `⛔ *សិទ្ធិមិនគ្រប់គ្រាន់ (Access Denied)*\n\nសូមអភ័យទោស! Bot នេះត្រូវបានកំណត់សម្រាប់តែ **Admin** និង **Super Admin** ប៉ុណ្ណោះ។ គណនីរបស់អ្នកត្រូវបានផ្តាច់។`, { parse_mode: 'Markdown' });
            }
            const userProfile = await UserProfile.findOne({ where: { user_id: existingUser.id } });
            const nameStr = userProfile ? `${userProfile.first_name_kh} ${userProfile.last_name_kh}` : existingUser.email;
            return bot.sendMessage(chatId, `✅ *គណនីរបស់អ្នកត្រូវបានភ្ជាប់រួចរាល់ហើយ! (Welcome Back!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${existingUser.email}\n\nលោកអ្នកនឹងទទួលបានសារ Alert រាល់ពេលមានសមាជិកថ្មីចុះឈ្មោះ! 🎉`, { parse_mode: 'Markdown' });
        }

        bot.sendMessage(chatId, 
            `🎉 *សូមស្វាគមន៍មកកាន់ប្រព័ន្ធជូនដំណឹងសមាជិកថ្មី (New Member Alert Bot)*\n\n` +
            `ដើម្បីភ្ជាប់គណនី សូមចុចប៊ូតុង **"📱 ចុចទីនេះដើម្បីភ្ជាប់គណនីស្វ័យប្រវត្តិ"** នៅខាងក្រោម ឬវាយបញ្ចូល **លេខទូរស័ព្ទ** ឬ **អ៊ីមែល** របស់អ្នកដោយផ្ទាល់នៅទីនេះ!`, 
            { 
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        [{ text: "📱 ចុចទីនេះដើម្បីភ្ជាប់គណនីស្វ័យប្រវត្តិ", request_contact: true }]
                    ],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            }
        );
    });

    // Link command fallback
    bot.onText(/\/link (.+)/, async (msg, match) => {
        const linked = await handleAutoLink(msg.chat.id, match[1], msg.from.username);
        if (!linked) {
            bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញគណនីសម្រាប់ "${match[1]}" ទេ។ សូមត្រួតពិនិត្យលេខទូរស័ព្ទ ឬអ៊ីមែលរបស់អ្នកឡើងវិញ។`);
        }
    });

} else {
    console.log('TELEGRAM_MEMBER_BOT_TOKEN not found. New Member Telegram bot is disabled.');
}

module.exports = bot;
