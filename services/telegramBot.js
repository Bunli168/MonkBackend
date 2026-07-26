const TelegramBot = require('node-telegram-bot-api').default || require('node-telegram-bot-api');
const { User, LeaveRequest, UserProfile, Role, Attendance } = require('../models');
const { transitionLeaveRequest } = require('../utils/leaveRequestWorkflow');

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: true });

    console.log('Telegram bot initialized and polling...');

    bot.on('message', (msg) => {
        console.log('BOT RECEIVED MESSAGE:', msg.text);
    });

    bot.on('polling_error', (error) => {
        console.log('BOT POLLING ERROR:', error);
    });

    // Basic /start command with optional deep link payload
    bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        const phone = match[1];

        if (phone) {
            // Processing deep link
            try {
                const user = await User.findOne({ where: { phone: phone } });
                
                if (!user) {
                    return bot.sendMessage(chatId, `❌ Could not find a user with phone number ${phone}.`);
                }

                user.telegram_chat_id = chatId.toString();
                user.telegram_username = msg.from.username || null;
                await user.save();

                bot.sendMessage(chatId, `✅ Successfully linked your Telegram to your Pagoda Management account!`);
            } catch (error) {
                console.error('Error linking telegram account via start payload:', error);
                bot.sendMessage(chatId, '❌ An error occurred while linking your account. Please contact admin.');
            }
        } else {
            bot.sendMessage(chatId, 'Welcome to the Pagoda Management Bot!\n\nTo link your account, please type:\n`/link <your-phone-number>`\n\nExample: `/link 012345678`', { parse_mode: 'Markdown' });
        }
    });
    // Link command
    bot.onText(/\/link (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const phone = match[1];

        try {
            // Find user by phone
            const user = await User.findOne({ where: { phone: phone } });
            
            if (!user) {
                return bot.sendMessage(chatId, `❌ Could not find a user with phone number ${phone}.`);
            }

            // Link the account
            user.telegram_chat_id = chatId.toString();
            user.telegram_username = msg.from.username || null;
            await user.save();

            bot.sendMessage(chatId, `✅ Successfully linked your Telegram to your Pagoda Management account!`);
        } catch (error) {
            console.error('Error linking telegram account:', error);
            bot.sendMessage(chatId, '❌ An error occurred while linking your account. Please contact admin.');
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

            if (!adminUser || ![1, 2, 3, 4].includes(adminUser.role_id)) {
                return bot.answerCallbackQuery(query.id, { text: 'Unauthorized. Only Admins can perform this action.', show_alert: true });
            }

            const [action, requestId] = data.split('_');
            const targetStatus = action === 'approve' ? 'approved' : 'rejected';

            const leaveRequest = await LeaveRequest.findByPk(requestId);
            if (!leaveRequest) {
                return bot.answerCallbackQuery(query.id, { text: 'Leave request not found.', show_alert: true });
            }

            if (leaveRequest.status !== 'pending') {
                return bot.answerCallbackQuery(query.id, { text: `This request is already ${leaveRequest.status}.`, show_alert: true });
            }

            const actorRole = adminUser.Role?.name || (adminUser.role_id === 1 ? 'SuperAdmin' : 'Admin');
            const workflow = transitionLeaveRequest({
                currentStatus: leaveRequest.status,
                requestedAction: targetStatus,
                actorRole
            });

            if (!workflow.allowed) {
                return bot.answerCallbackQuery(query.id, { text: `Not allowed: ${workflow.message}`, show_alert: true });
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
                for (const sa of superAdmins) {
                    const message = `🔔 *Leave Request Forwarded*\n\n*Monk:* ${monkNameStr}\n*From:* ${leaveRequest.start_date}\n*To:* ${leaveRequest.end_date}\n*Reason:* ${leaveRequest.reason}`;
                    bot.sendMessage(sa.telegram_chat_id, message, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '✅ Final Approve', callback_data: `approve_${leaveRequest.id}` },
                                    { text: '❌ Reject', callback_data: `reject_${leaveRequest.id}` }
                                ]
                            ]
                        }
                    }).catch(() => {});
                }
            }

            bot.answerCallbackQuery(query.id, { text: workflow.message });

            // Update original message
            const adminProfile = await UserProfile.findOne({ where: { user_id: adminUser.id } });
            const adminName = adminProfile ? `${adminProfile.first_name_kh} ${adminProfile.last_name_kh}` : 'Admin';
            
            let actionText = '';
            if (workflow.nextStatus === 'approved') actionText = '✅ Approved';
            else if (workflow.nextStatus === 'rejected') actionText = '❌ Rejected';
            else if (workflow.nextStatus === 'pending_superadmin') actionText = '✅ Forwarded to Super Admin';

            const updatedText = query.message.text + `\n\n_${actionText} by ${adminName}_`;

            bot.editMessageText(updatedText, {
                chat_id: chatId,
                message_id: query.message.message_id,
                parse_mode: 'Markdown'
            });

        } catch (error) {
            console.error('Callback query error:', error);
            bot.answerCallbackQuery(query.id, { text: 'An error occurred.', show_alert: true });
        }
    });

} else {
    console.log('TELEGRAM_BOT_TOKEN not found. Telegram bot is disabled.');
}

module.exports = bot;
