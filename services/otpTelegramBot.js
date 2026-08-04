const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const { User, UserProfile, Role } = require('../models');

const token = process.env.TELEGRAM_OTP_BOT_TOKEN;
let bot = null;
const linkingTokens = new Map();

if (token) {
    bot = new TelegramBot(token, { polling: true });

    bot.generateLinkingToken = function(userId) {
        const tk = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        linkingTokens.set(tk, userId);
        setTimeout(() => linkingTokens.delete(tk), 5 * 60 * 1000);
        return tk;
    };

    bot.getMe().then((me) => {}).catch(err => );

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
                user = (await User.findOne({ where: { email: norm } })) || (await User.findOne({ where: { phone: norm } }));
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

            user.otp_telegram_chat_id = chatId.toString();
            user.otp_telegram_username = username || null;
            await user.save();

            if (!userProfile) {
                userProfile = await UserProfile.findOne({ where: { user_id: user.id } });
            }

            const nameStr = userProfile ? `${userProfile.first_name_kh} ${userProfile.last_name_kh}` : user.email;
            bot.sendMessage(chatId, `✅ *ភ្ជាប់គណនី OTP ជោគជ័យ! (OTP Account Linked Successfully!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${user.email}\n\nចាប់ពីពេលនេះតទៅ លោកអ្នកនឹងទទួលបានកូដ OTP នៅទីនេះ! 🎉`, { 
                parse_mode: 'Markdown',
                reply_markup: { remove_keyboard: true }
            });
            return true;
        } catch (error) {
            console.error('Error in handleAutoLink OTP bot:', error);
            return false;
        }
    }

    bot.on('message', async (msg) => {
        if (msg.contact && msg.contact.phone_number) {
            const linked = await handleAutoLink(msg.chat.id, msg.contact.phone_number, msg.from.username);
            if (!linked) {
                bot.sendMessage(msg.chat.id, `❌ *រកមិនឃើញគណនីក្នុងប្រព័ន្ធ ឬគ្មានសិទ្ធិជា Admin*\nសូមត្រួតពិនិត្យលេខទូរស័ព្ទក្នុង Profile របស់អ្នក។`, { parse_mode: 'Markdown' });
            }
            return;
        }

        if (msg.text && !msg.text.startsWith('/')) {
            // Normal texts are ignored to prevent hijacking by sending someone else's phone number
        }
    });

    bot.on('polling_error', (error) => {});

    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const payload = match[1];

        if (payload) {
            if (linkingTokens.has(payload)) {
                const userId = linkingTokens.get(payload);
                linkingTokens.delete(payload);
                
                let user = await User.findByPk(userId);
                if (user) {
                    user.otp_telegram_chat_id = chatId.toString();
                    user.otp_telegram_username = msg.from.username || null;
                    await user.save();
                    
                    const userProfile = await UserProfile.findOne({ where: { user_id: user.id } });
                    const nameStr = userProfile ? `${userProfile.first_name_kh} ${userProfile.last_name_kh}` : user.email;
                    return bot.sendMessage(chatId, `✅ *ភ្ជាប់គណនី OTP ជោគជ័យ! (OTP Account Linked Successfully!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${user.email}\n\nចាប់ពីពេលនេះតទៅ លោកអ្នកនឹងទទួលបានកូដ OTP នៅទីនេះ! 🎉`, { 
                        parse_mode: 'Markdown',
                        reply_markup: { remove_keyboard: true }
                    });
                }
            } else {
                const linked = await handleAutoLink(chatId, payload, msg.from.username);
                if (linked) return;
            }
        }

        // Check if already linked
        const existingUser = await User.findOne({ where: { otp_telegram_chat_id: chatId.toString() }, include: [Role] });
        if (existingUser) {
            const roleName = existingUser.Role ? existingUser.Role.name.toLowerCase() : '';
            const isAdminRole = existingUser.role_id === 1 || existingUser.role_id === 2 || ['admin', 'super_admin'].includes(roleName);
            if (!isAdminRole) {
                existingUser.otp_telegram_chat_id = null;
                existingUser.otp_telegram_username = null;
                await existingUser.save();
                return bot.sendMessage(chatId, `⛔ *សិទ្ធិមិនគ្រប់គ្រាន់ (Access Denied)*\n\nសូមអភ័យទោស! Bot នេះត្រូវបានកំណត់សម្រាប់តែ **Admin** និង **Super Admin** ប៉ុណ្ណោះ។ គណនីរបស់អ្នកត្រូវបានផ្តាច់។`, { parse_mode: 'Markdown' });
            }
            const userProfile = await UserProfile.findOne({ where: { user_id: existingUser.id } });
            const nameStr = userProfile ? `${userProfile.first_name_kh} ${userProfile.last_name_kh}` : existingUser.email;
            return bot.sendMessage(chatId, `✅ *គណនី OTP របស់អ្នកត្រូវបានភ្ជាប់រួចរាល់ហើយ! (Welcome Back!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${existingUser.email}\n\nលោកអ្នកនឹងទទួលបានកូដ OTP នៅទីនេះ! 🎉`, { parse_mode: 'Markdown' });
        }

        bot.sendMessage(chatId, 
            `🔒 *សូមស្វាគមន៍មកកាន់ប្រព័ន្ធសុវត្ថិភាព OTP (OTP Security Bot)*\n\n` +
            `ដើម្បីភ្ជាប់គណនីសម្រាប់ទទួលកូដ OTP ពេល Login សូមចុចប៊ូតុង **"📱 ចុចទីនេះដើម្បីភ្ជាប់គណនីស្វ័យប្រវត្តិ"** នៅខាងក្រោម ឬវាយបញ្ចូល **លេខទូរស័ព្ទ** ឬ **អ៊ីមែល** របស់អ្នកដោយផ្ទាល់នៅទីនេះ!`, 
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

    bot.onText(/\/link (.+)/, async (msg, match) => {
        const linked = await handleAutoLink(msg.chat.id, match[1], msg.from.username);
        if (!linked) {
            bot.sendMessage(msg.chat.id, `❌ រកមិនឃើញគណនីសម្រាប់ "${match[1]}" ទេ។ សូមត្រួតពិនិត្យលេខទូរស័ព្ទ ឬអ៊ីមែលរបស់អ្នកឡើងវិញ។`);
        }
    });
} else {}

module.exports = bot;
