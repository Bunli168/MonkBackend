const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const { User, LeaveRequest, UserProfile, Role, Attendance } = require('../models');
const { transitionLeaveRequest } = require('../utils/leaveRequestWorkflow');

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;
const linkingTokens = new Map(); // Store temporary tokens for linking accounts

if (token) {
    bot = new TelegramBot(token, { polling: true });

    bot.getMe().then((me) => {}).catch(err => console.error(err));

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

            // Verify role: SuperAdmin, Admin, and Mekudi (Kudi Admin) can link
            if (!user.Role && Role) {
                user = await User.findByPk(user.id, { include: [Role] });
            }
            const roleName = user.Role ? user.Role.name.toLowerCase() : '';
            // ✅ role_id 1=SuperAdmin, 2=Admin, 3=Mekudi (Kudi head who approves leave requests)
            const isAdminRole = [1, 2, 3].includes(user.role_id) || ['admin', 'super_admin', 'superadmin', 'mekudi'].includes(roleName);
            if (!isAdminRole) {
                bot.sendMessage(chatId, `⛔ *សិទ្ធិមិនគ្រប់គ្រាន់ (Access Denied)*\n\nBot នេះត្រូវបានកំណត់សម្រាប់ **Admin**, **Mekudi (Kudi Admin)**, និង **Super Admin** ប៉ុណ្ណោះ។ គណនីរបស់អ្នកមិនមានសិទ្ធិទេ។`, { parse_mode: 'Markdown' });
                return false;
            }

            user.telegram_chat_id = chatId.toString();
            user.telegram_username = username || null;
            await user.save();

            if (!userProfile) {
                userProfile = await UserProfile.findOne({ where: { user_id: user.id } });
            }

            const nameStr = userProfile ? `${userProfile.first_name_kh} ${userProfile.last_name_kh}` : user.email;
            bot.sendMessage(chatId, `✅ *ភ្ជាប់គណនីជោគជ័យ! (Account Linked Successfully!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${user.email}\n\nអ្នកនឹងទទួលបានសារជូនដំណឹងនៅទីនេះដោយស្វ័យប្រវត្តិ។`, { 
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

    bot.on('polling_error', (error) => {});

    // /start command with auto detection and 1-click contact button
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const payload = match[1];

        if (payload) {
            if (linkingTokens.has(payload)) {
                // Link via token (Admin)
                const linkData = linkingTokens.get(payload);
                if (linkData.expiresAt > Date.now()) {
                    const user = await User.findByPk(linkData.userId);
                    if (user) {
                        user.telegram_chat_id = chatId.toString();
                        user.telegram_username = msg.from.username || null;
                        await user.save();
                        
                        const profile = await UserProfile.findOne({ where: { user_id: user.id } });
                        const nameStr = profile ? `${profile.first_name_kh} ${profile.last_name_kh}` : user.email;
                        
                        bot.sendMessage(chatId, `✅ *ភ្ជាប់គណនីជោគជ័យ! (Account Linked Successfully!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${user.email}\n\nអ្នកនឹងទទួលបានសារជូនដំណឹងនៅទីនេះដោយស្វ័យប្រវត្តិ។`, { parse_mode: 'Markdown' });
                        linkingTokens.delete(payload);
                        return;
                    }
                }
                linkingTokens.delete(payload);
                bot.sendMessage(chatId, `❌ *Token ផុតកំណត់ ឬមិនត្រឹមត្រូវ (Invalid or expired token)*\nសូមព្យាយាមម្ដងទៀត។`, { parse_mode: 'Markdown' });
                return;
            } else {
                // Try phone or email
                const linked = await handleAutoLink(chatId, payload, msg.from.username);
                if (linked) return;
            }
        }

        // Check if already linked
        const existingUser = await User.findOne({ where: { telegram_chat_id: chatId.toString() }, include: [Role] });
        if (existingUser) {
            const roleName = existingUser.Role ? existingUser.Role.name.toLowerCase() : '';
            // ✅ Include Mekudi in allowed roles
            const isAdminRole = [1, 2, 3].includes(existingUser.role_id) || ['admin', 'super_admin', 'superadmin', 'mekudi'].includes(roleName);
            if (!isAdminRole) {
                existingUser.telegram_chat_id = null;
                existingUser.telegram_username = null;
                await existingUser.save();
                return bot.sendMessage(chatId, `⛔ *សិទ្ធិមិនគ្រប់គ្រាន់ (Access Denied)*\n\nBot នេះសម្រាប់ **Admin**, **Mekudi**, និង **Super Admin** ប៉ុណ្ណោះ។ គណនីរបស់អ្នកត្រូវបានផ្តាច់។`, { parse_mode: 'Markdown' });
            }
            const userProfile = await UserProfile.findOne({ where: { user_id: existingUser.id } });
            const nameStr = userProfile ? `${userProfile.first_name_kh} ${userProfile.last_name_kh}` : existingUser.email;
            return bot.sendMessage(chatId, `✅ *គណនីរបស់អ្នកត្រូវបានភ្ជាប់រួចរាល់ហើយ! (Welcome Back!)*\n\n👤 *ឈ្មោះ៖* ${nameStr}\n📧 *អ៊ីមែល៖* ${existingUser.email}\n\nអ្នកនឹងទទួលបានសារជូនដំណឹងនៅទីនេះដោយស្វ័យប្រវត្តិ។`, { parse_mode: 'Markdown' });
        }

        bot.sendMessage(chatId,
            `🙏 *សូមស្វាគមន៍! (Pagoda Management Bot — ច្បាប់)*\n\n` +
            `Bot នេះសម្រាប់ **Admin**, **Mekudi (Kudi Admin)**, និង **Super Admin** ដើម្បីទទួល និងអនុម័ត/បដិសេធ ច្បាប់សុំច្បាប់ (Leave Request)\n\n` +
            `ដើម្បីភ្ជាប់គណនី សូមចុចប៊ូតុង **"📱 ភ្ជាប់គណនីស្វ័យប្រវត្តិ"** នៅខាងក្រោម ឬវាយ **លេខទូរស័ព្ទ** ឬ **អ៊ីមែល** របស់អ្នក!\n\n` +
            `📌 *Commands:*\n/pending — មើលសំណើរសុំច្បាប់កំពុងរង់ចាំ\n/start — ម៉ឺនុយដំបូង`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        [{ text: "📱 ភ្ជាប់គណនីស្វ័យប្រវត្តិ", request_contact: true }]
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

    // /pending command — list pending leave requests for this admin's kudi
    bot.onText(/\/pending/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            const adminUser = await User.findOne({
                where: { telegram_chat_id: chatId.toString() },
                include: [{ model: Role, as: 'Role' }, { model: UserProfile, as: 'UserProfile' }]
            });

            if (!adminUser) {
                return bot.sendMessage(chatId, `❌ *គណនីមិនទាន់ភ្ជាប់ (Account not linked)*\nសូមវាយ /start ដើម្បីភ្ជាប់គណនី។`, { parse_mode: 'Markdown' });
            }

            const { Op } = require('sequelize');
            let whereClause = { status: { [Op.in]: ['pending', 'pending_mekudi'] } };

            // Scope to kudi if this admin/mekudi has a kut_id
            const adminProfile = adminUser.UserProfile;
            let kudName = 'All Kudis';
            let includeClause = [
                {
                    model: User,
                    as: 'User',
                    attributes: ['id'],
                    include: [{
                        model: UserProfile,
                        attributes: ['first_name_kh', 'last_name_kh', 'kut_id', 'phone_number']
                    }]
                }
            ];

            // If they are scoped to a kudi, only show their kudi's requests
            if (adminProfile && adminProfile.kut_id && adminUser.role_id !== 1) {
                const { Kut } = require('../models');
                const kut = await Kut.findByPk(adminProfile.kut_id);
                kudName = kut ? kut.name : `Kudi ${adminProfile.kut_id}`;
                includeClause[0].where = {}; // will filter via the include
                includeClause[0].required = true;
                includeClause[0].include[0].where = { kut_id: adminProfile.kut_id };
                includeClause[0].include[0].required = true;
            } else if (adminUser.role_id === 1) {
                // SuperAdmin sees pending_superadmin requests
                whereClause = { status: 'pending_superadmin' };
                kudName = 'All Kudis (SuperAdmin Queue)';
            }

            const { LeaveRequest } = require('../models');
            const requests = await LeaveRequest.findAll({
                where: whereClause,
                include: includeClause,
                order: [['created_at', 'ASC']],
                limit: 10
            });

            if (requests.length === 0) {
                return bot.sendMessage(chatId,
                    `✅ *គ្មានសំណើរសុំច្បាប់ (No Pending Requests)*\n\nKudi: ${kudName}\n\nបច្ចុប្បន្នគ្មានសំណើរសុំច្បាប់ណាមួយទេ! 🎉`,
                    { parse_mode: 'Markdown' }
                );
            }

            let text = `📋 *សំណើរសុំច្បាប់ (Pending Requests)*\n*Kudi: ${kudName}*\n\n`;
            for (const req of requests) {
                const profile = req.User && req.User.UserProfile;
                const name = profile ? `${profile.first_name_kh} ${profile.last_name_kh}` : `User #${req.user_id}`;
                const days = Math.ceil(Math.abs(new Date(req.end_date) - new Date(req.start_date)) / (1000 * 60 * 60 * 24)) + 1;
                text += `• *${name}* — ${req.start_date} to ${req.end_date} (${days}d)\n  Status: ${req.status}\n  ID: ${req.id}\n\n`;
            }
            text += `_ចុចប៊ូតុង Approve/Reject ក្នុងសារជូនដំណឹងដើម្បីធ្វើការ_`;

            bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        } catch (err) {
            bot.sendMessage(chatId, `❌ មានបញ្ហាក្នុងការទាញទិន្នន័យ។ សូមព្យាយាមមើលម្ដងទៀត។`);
        }
    });

    // Handle inline keyboard button clicks
    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const data = query.data; // e.g., 'approve_1' or 'reject_1'

        try {
            // Find the admin user
            const adminUser = await User.findOne({ 
                where: { telegram_chat_id: chatId.toString() },
                include: [{ model: Role, as: 'Role' }]
            });

            if (!adminUser || !adminUser.Role) {
                return bot.answerCallbackQuery(query.id, { text: 'Unauthorized. User or Role not found.', show_alert: true }).catch(() => {});
            }

            const [action, requestId] = data.split('_');
            const targetStatus = action === 'approve' ? 'approved' : 'rejected';

            const leaveRequest = await LeaveRequest.findByPk(requestId);
            if (!leaveRequest) {
                return bot.answerCallbackQuery(query.id, { text: 'Leave request not found.', show_alert: true }).catch(() => {});
            }

            if (leaveRequest.status === 'approved' || leaveRequest.status === 'rejected') {
                // If the user clicks an old button, just remove it from the message to clean it up
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                    chat_id: chatId,
                    message_id: query.message.message_id
                }).catch(() => {});
                return bot.answerCallbackQuery(query.id, { text: `This request is already ${leaveRequest.status}.`, show_alert: true }).catch(() => {});
            }

            const actorRole = adminUser.Role?.name || (adminUser.role_id === 1 ? 'SuperAdmin' : 'Admin');
            const workflow = transitionLeaveRequest({
                currentStatus: leaveRequest.status,
                requestedAction: targetStatus,
                actorRole
            });

            if (!workflow.allowed) {
                return bot.answerCallbackQuery(query.id, { text: `Not allowed: ${workflow.message}`, show_alert: true }).catch(() => {});
            }

            leaveRequest.status = workflow.nextStatus;
            leaveRequest.approved_by = adminUser.id;
            await leaveRequest.save();

            // If fully approved, automatically create/update Attendance records for the date range
            if (workflow.nextStatus === 'approved') {
                const startDate = new Date(leaveRequest.start_date);
                const endDate = new Date(leaveRequest.end_date);
                
                const profile = await UserProfile.findOne({ where: { user_id: leaveRequest.user_id } });
                
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    
                    await Attendance.upsert({
                        user_id: leaveRequest.user_id,
                        retreat_event_id: leaveRequest.retreat_event_id,
                        date: dateStr,
                        status: 'permission',
                        notes: 'Approved Leave: ' + leaveRequest.reason,
                        seating_row_id: profile ? profile.seating_row_id : null,
                        seat_number: profile ? profile.seat_number : null,
                        kut_id: profile ? profile.kut_id : null
                    });
                }
            }

            // Notify user via Socket.IO
            try {
                const { emitToUser } = require('../config/socket');
                emitToUser(leaveRequest.user_id, 'leave_request_updated', {
                    id: leaveRequest.id,
                    status: workflow.nextStatus
                });
            } catch (e) {
                console.error('Socket emit error:', e);
            }

            // Notify Monk
            const monkUser = await User.findByPk(leaveRequest.user_id);
            if (monkUser && monkUser.telegram_chat_id) {
                const statusEmoji = workflow.nextStatus === 'approved' ? '✅' : (workflow.nextStatus === 'rejected' ? '❌' : '⏳');
                let notifyText = `${statusEmoji} Your leave request (ID: ${leaveRequest.id}) has been *${workflow.nextStatus.toUpperCase()}*.`;
                if (workflow.nextStatus === 'pending_superadmin') {
                    notifyText = `⏳ Your leave request (ID: ${leaveRequest.id}) has been forwarded to the Super Admin for final approval.`;
                }
                bot.sendMessage(monkUser.telegram_chat_id, notifyText, { parse_mode: 'Markdown' }).catch(() => {});
            }

            // Notify Super Admin if forwarded
            if (workflow.nextStatus === 'pending_superadmin') {
                try {
                    const { emitToSuperAdmins } = require('../config/socket');
                    emitToSuperAdmins('new_leave_request', {
                        id: leaveRequest.id,
                        user_id: leaveRequest.user_id,
                        start_date: leaveRequest.start_date,
                        end_date: leaveRequest.end_date,
                        status: 'pending_superadmin'
                    });
                } catch (e) {
                    console.error('Superadmin socket emit error:', e);
                }

                const superAdmins = await User.findAll({ where: { role_id: 1, telegram_chat_id: { [require('sequelize').Op.not]: null } } });
                const monkProfile = await UserProfile.findOne({ where: { user_id: leaveRequest.user_id } });
                const monkNameStr = monkProfile ? `${monkProfile.first_name_kh} ${monkProfile.last_name_kh}` : `User ID ${leaveRequest.user_id}`;
                const fs = require('fs');
                const path = require('path');
                let photoPath = null;
                if (leaveRequest.image_url) {
                    photoPath = path.join(__dirname, '..', leaveRequest.image_url);
                    if (!fs.existsSync(photoPath)) photoPath = null;
                }

                for (const sa of superAdmins) {
                    const sDate = new Date(leaveRequest.start_date);
                    const eDate = new Date(leaveRequest.end_date);
                    const diffDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
                    const dayLabel = diffDays === 1 ? '1 day' : `${diffDays} days`;

                    const message = `🔔 *Leave Request Forwarded*\n\n*Monk:* ${monkNameStr}\n*Start:* ${leaveRequest.start_date}\n*End:* ${leaveRequest.end_date}\n*Duration:* ${dayLabel}\n*Reason:* ${leaveRequest.reason}`;
                    const options = {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '✅ Final Approve', callback_data: `approve_${leaveRequest.id}` },
                                    { text: '❌ Reject', callback_data: `reject_${leaveRequest.id}` }
                                ]
                            ]
                        }
                    };
                    
                    if (photoPath) {
                        bot.sendPhoto(sa.telegram_chat_id, photoPath, { ...options, caption: message }).catch(() => {});
                    } else {
                        bot.sendMessage(sa.telegram_chat_id, message, options).catch(() => {});
                    }
                }
            }

            bot.answerCallbackQuery(query.id, { text: workflow.message }).catch(() => {});

            // Update original message
            const adminProfile = await UserProfile.findOne({ where: { user_id: adminUser.id } });
            const adminName = adminProfile ? `${adminProfile.first_name_kh} ${adminProfile.last_name_kh}` : 'Admin';
            
            let actionText = '';
            if (workflow.nextStatus === 'approved') actionText = '✅ Approved';
            else if (workflow.nextStatus === 'rejected') actionText = '❌ Rejected';
            else if (workflow.nextStatus === 'pending_superadmin') actionText = '✅ Forwarded to Super Admin';

            const isPhotoMessage = query.message.photo && query.message.photo.length > 0;
            const currentText = isPhotoMessage ? (query.message.caption || '') : (query.message.text || '');
            
            // Always append using HTML formatting, since we don't have the original HTML tags anyway,
            // we will just format the new part and assume Telegram will parse it.
            // If currentText has Markdown characters, parse_mode HTML safely ignores them instead of failing.
            const updatedText = currentText + `\n\n<i>${actionText} by ${adminName}</i>`;
            
            const options = {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: [] } // Explicitly remove buttons
            };

            if (isPhotoMessage) {
                bot.editMessageCaption(updatedText, options).catch(err => {
                    console.error('editMessageCaption error:', err.message);
                });
            } else {
                bot.editMessageText(updatedText, options).catch(err => {
                    console.error('editMessageText error:', err.message);
                });
            }

        } catch (error) {
            console.error('Callback query error:', error);
            bot.answerCallbackQuery(query.id, { text: 'An error occurred.', show_alert: true }).catch(() => {});
        }
    });
} else {}

const generateLinkingToken = (userId) => {
    const crypto = require('crypto');
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    
    linkingTokens.set(token, {
        userId,
        expiresAt
    });

    // Cleanup old tokens periodically
    for (const [key, value] of linkingTokens.entries()) {
        if (value.expiresAt < Date.now()) {
            linkingTokens.delete(key);
        }
    }

    return token;
};

module.exports = bot ? Object.assign(bot, { generateLinkingToken }) : { generateLinkingToken };
