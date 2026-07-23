const { LeaveRequest, User, UserProfile, Attendance, RetreatEvent } = require('../models');
const { transitionLeaveRequest } = require('../utils/leaveRequestWorkflow');
const telegramBot = require('../services/telegramBot');

// Monks: Create a new leave request
exports.createRequest = async (req, res) => {
    try {
        const { start_date, end_date, reason } = req.body;
        
        if (!start_date || !end_date || !reason) {
            return res.status(400).json({ message: 'Start date, end date, and reason are required' });
        }

        const { Op } = require('sequelize');
        // Check for overlapping leave requests
        const overlappingRequest = await LeaveRequest.findOne({
            where: {
                user_id: req.user.id,
                status: { [Op.notIn]: ['rejected'] },
                [Op.or]: [
                    {
                        start_date: { [Op.lte]: end_date },
                        end_date: { [Op.gte]: start_date }
                    }
                ]
            }
        });

        if (overlappingRequest) {
            return res.status(400).json({ message: 'You already have a leave request during this period.' });
        }

        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });

        const leaveRequest = await LeaveRequest.create({
            user_id: req.user.id,
            retreat_event_id: activeYear ? activeYear.id : null,
            start_date,
            end_date,
            reason,
            status: 'pending'
        });

        res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
        
        try {
            const { emitToAdmins } = require('../config/socket');
            emitToAdmins('new_leave_request', {
                id: leaveRequest.id,
                user_id: req.user.id,
                start_date,
                end_date,
                status: 'pending'
            });
        } catch (e) {
            console.error('Socket emit error:', e);
        }

        // --- TELEGRAM NOTIFICATION ---
        try {
            if (telegramBot) {
                const { Op } = require('sequelize');
                // Find all Mekudis (2) with a linked Telegram account
                const admins = await User.findAll({
                    where: {
                        role_id: 2,
                        telegram_chat_id: { [Op.not]: null }
                    }
                });

                if (admins.length > 0) {
                    const monkProfile = await UserProfile.findOne({ where: { user_id: req.user.id } });
                    const monkName = monkProfile ? `${monkProfile.first_name_kh} ${monkProfile.last_name_kh}` : `User ID ${req.user.id}`;
                    
                    const message = `🔔 *New Leave Request*\n\n*Monk:* ${monkName}\n*From:* ${start_date}\n*To:* ${end_date}\n*Reason:* ${reason}`;
                    
                    for (const admin of admins) {
                        telegramBot.sendMessage(admin.telegram_chat_id, message, { 
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '✅ Approve', callback_data: `approve_${leaveRequest.id}` },
                                        { text: '❌ Reject', callback_data: `reject_${leaveRequest.id}` }
                                    ]
                                ]
                            }
                        }).catch(err => console.error('Telegram send error:', err));
                    }
                }
            }
        } catch (e) {
            console.error('Telegram notification error:', e);
        }
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ message: 'Failed to create leave request' });
    }
};

// Monks: Get their own requests
exports.getMyRequests = async (req, res) => {
    try {
        const { retreat_event_id } = req.query;
        let activeYearId = retreat_event_id;
        if (!activeYearId) {
            const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
            activeYearId = activeYear ? activeYear.id : null;
        }
        const eventFilter = activeYearId ? { retreat_event_id: activeYearId } : {};

        const requests = await LeaveRequest.findAll({
            where: { user_id: req.user.id, ...eventFilter },
            include: [
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['id'],
                    include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching own leave requests:', error);
        res.status(500).json({ message: 'Failed to fetch leave requests' });
    }
};

// Admin/Mekudi: Get all leave requests
exports.getAllRequests = async (req, res) => {
    try {
        const { status, retreat_event_id } = req.query;
        
        let activeYearId = retreat_event_id;
        if (!activeYearId) {
            const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
            activeYearId = activeYear ? activeYear.id : null;
        }
        
        let whereClause = activeYearId ? { retreat_event_id: activeYearId } : {};
        
        if (status) {
            const { Op } = require('sequelize');
            if (status === 'pending') {
                const role = req.user?.Role?.name || req.user?.role || '';
                const uRole = role.toUpperCase();
                if (uRole === 'SUPERADMIN') {
                    whereClause.status = 'pending_superadmin';
                } else if (['ADMIN', 'MEKUDI'].includes(uRole)) {
                    whereClause.status = { [Op.or]: ['pending', 'pending_mekudi'] };
                } else {
                    whereClause.status = { [Op.or]: ['pending', 'pending_mekudi', 'pending_superadmin'] };
                }
            } else if (status === 'approved') {
                const role = req.user?.Role?.name || req.user?.role || '';
                if (role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'MEKUDI') {
                    whereClause.status = { [Op.or]: ['approved', 'pending_superadmin'] };
                } else {
                    whereClause.status = 'approved';
                }
            } else {
                whereClause.status = status;
            }
        } else {
            // If no status is specified (e.g., "All Requests" tab), Super Admins should not see requests waiting for Admin approval
            const role = req.user?.Role?.name || req.user?.role || '';
            if (role.toUpperCase() === 'SUPERADMIN') {
                const { Op } = require('sequelize');
                whereClause.status = { [Op.notIn]: ['pending', 'pending_mekudi'] };
            }
        }

        const includeUser = {
            model: User,
            attributes: ['id'],
            include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh', 'kut_id'] }]
        };

        const role = req.user?.Role?.name || req.user?.role || '';
        if (role.toUpperCase() === 'MEKUDI' && req.user.UserProfile?.kut_id) {
            includeUser.required = true;
            includeUser.include[0].where = { kut_id: req.user.UserProfile.kut_id };
        } else if (role.toUpperCase() === 'ADMIN') {
            const { SeatingRow } = require('../models');
            const { Op } = require('sequelize');
            const myRows = await SeatingRow.findAll({ where: { assigned_taker_id: req.user.id } });
            const myRowIds = myRows.map(r => r.id);
            
            includeUser.required = true;
            includeUser.include[0].where = { seating_row_id: { [Op.in]: myRowIds.length > 0 ? myRowIds : [-1] } };
        }

        const requests = await LeaveRequest.findAll({
            where: whereClause,
            include: [
                includeUser,
                {
                    model: User,
                    as: 'Approver',
                    attributes: ['id'],
                    include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        console.error('Error fetching all leave requests:', error);
        res.status(500).json({ message: 'Failed to fetch leave requests' });
    }
};

// Admin/Mekudi: Update status (Approve/Reject)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const leaveRequest = await LeaveRequest.findByPk(id);
        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        const actorRole = req.user?.Role?.name || req.user?.role || '';
        const workflow = transitionLeaveRequest({
            currentStatus: leaveRequest.status,
            requestedAction: status,
            actorRole
        });

        if (!workflow.allowed) {
            return res.status(403).json({ message: workflow.message });
        }

        leaveRequest.status = workflow.nextStatus;
        leaveRequest.approved_by = req.user.id;
        await leaveRequest.save();

        // If fully approved, automatically create/update Attendance records for the date range
        if (workflow.nextStatus === 'approved') {
            const startDate = new Date(leaveRequest.start_date);
            const endDate = new Date(leaveRequest.end_date);
            
            // Fetch user profile to populate seating/kut info
            const UserProfile = require('../models/UserProfile');
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

        res.json({ message: workflow.message, leaveRequest });

        // --- TELEGRAM NOTIFICATION TO MONK ---
        try {
            if (telegramBot) {
                const monkUser = await User.findByPk(leaveRequest.user_id);
                if (monkUser && monkUser.telegram_chat_id) {
                    const statusEmoji = workflow.nextStatus === 'approved' ? '✅' : (workflow.nextStatus === 'rejected' ? '❌' : '⏳');
                    let statusText = workflow.nextStatus.toUpperCase();
                    if (workflow.nextStatus === 'pending_superadmin') statusText = 'PENDING SUPER ADMIN APPROVAL';
                    
                    const message = `${statusEmoji} *Leave Request Update*\n\nYour leave request from *${leaveRequest.start_date}* to *${leaveRequest.end_date}* is now:\n\n*${statusText}*`;
                    telegramBot.sendMessage(monkUser.telegram_chat_id, message, { parse_mode: 'Markdown' }).catch(err => console.error('Telegram send error:', err));
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

                    const { Op } = require('sequelize');
                    const superAdmins = await User.findAll({ where: { role_id: 1, telegram_chat_id: { [Op.not]: null } } });
                    const monkProfile = await UserProfile.findOne({ where: { user_id: leaveRequest.user_id } });
                    const monkNameStr = monkProfile ? `${monkProfile.first_name_kh} ${monkProfile.last_name_kh}` : `User ID ${leaveRequest.user_id}`;
                    for (const sa of superAdmins) {
                        const message = `🔔 *Leave Request Forwarded*\n\n*Monk:* ${monkNameStr}\n*From:* ${leaveRequest.start_date}\n*To:* ${leaveRequest.end_date}\n*Reason:* ${leaveRequest.reason}`;
                        telegramBot.sendMessage(sa.telegram_chat_id, message, {
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
            }
        } catch (e) {
            console.error('Telegram notification error:', e);
        }
    } catch (error) {
        console.error('Error updating leave request status:', error);
        res.status(500).json({ message: 'Failed to update leave request status' });
    }
};
