const { Op } = require('sequelize');
const { LeaveRequest, User } = require('../models');
const telegramBot = require('./telegramBot');

let lastRunDateStr = '';

function startCronJobs() {
    // Check every 5 minutes
    setInterval(async () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        
        // Run between 23:50 and 23:59 local time (server time)
        if (now.getHours() === 23 && now.getMinutes() >= 50) {
            if (lastRunDateStr !== dateStr) {
                lastRunDateStr = dateStr;
                console.log(`[Cron] Running daily auto-reject job for date: ${dateStr}`);
                await autoRejectPendingLeaveRequests();
            }
        }
    }, 5 * 60 * 1000);
}

async function autoRejectPendingLeaveRequests() {
    try {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Find all leave requests that are pending_superadmin and their start_date is today or earlier
        const expiredRequests = await LeaveRequest.findAll({
            where: {
                status: 'pending_superadmin',
                start_date: { [Op.lte]: todayStr }
            }
        });

        for (const req of expiredRequests) {
            req.status = 'rejected';
            await req.save();
            
            // Notify Monk via Telegram
            try {
                const monkUser = await User.findByPk(req.user_id);
                if (monkUser && monkUser.telegram_chat_id && telegramBot.sendMessage) {
                    const message = `❌ <b>Leave Request Auto-Rejected</b>\n\nYour leave request (ID: ${req.id}) was not approved by the Super Admin in time for the requested date, so it has been automatically rejected.`;
                    telegramBot.sendMessage(monkUser.telegram_chat_id, message, { parse_mode: 'HTML' }).catch(() => {});
                }
            } catch (err) {
                console.error('Error notifying monk for auto-reject:', err);
            }

            // Notify via Socket.io
            try {
                const { emitToUser } = require('../config/socket');
                emitToUser(req.user_id, 'leave_request_updated', {
                    id: req.id,
                    status: 'rejected'
                });
            } catch (err) {}
        }
        
        if (expiredRequests.length > 0) {
            console.log(`[Cron] Auto-rejected ${expiredRequests.length} leave requests.`);
        }
    } catch (error) {
        console.error('[Cron] Error running auto-reject job:', error);
    }
}

module.exports = { startCronJobs };
