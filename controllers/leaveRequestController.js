const { LeaveRequest, User, UserProfile, Attendance, RetreatEvent } = require('../models');
const { Op } = require('sequelize');
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
        // Check for overlapping leave requests in the current event
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        const overlappingRequest = await LeaveRequest.findOne({
            where: {
                user_id: req.user.id,
                status: { [Op.notIn]: ['rejected'] },
                retreat_event_id: activeYear ? activeYear.id : null,
                [Op.and]: [
                    { start_date: { [Op.lte]: end_date } },
                    { end_date: { [Op.gte]: start_date } }
                ]
            }
        });

        if (overlappingRequest) {
            return res.status(400).json({ message: 'You already have a leave request during this period.' });
        }



        let image_url = null;
        if (req.file) {
            image_url = `/uploads/leave-requests/${req.file.filename}`;
        }

        const isAdmin = req.user.Role && ['Admin', 'Superadmin'].includes(req.user.Role.name);
        const status = isAdmin ? 'approved' : 'pending';
        const approved_by = isAdmin ? req.user.id : null;

        const leaveRequest = await LeaveRequest.create({
            user_id: req.user.id,
            retreat_event_id: activeYear ? activeYear.id : null,
            start_date,
            end_date,
            reason,
            status,
            approved_by,
            image_url
        });

        if (status === 'approved') {
            const startDateObj = new Date(start_date);
            const endDateObj = new Date(end_date);
            const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
            let retreatId = activeYear ? activeYear.id : 1;

            for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                let existingAttendance = await Attendance.findOne({
                    where: { user_id: req.user.id, date: dateStr }
                });

                if (existingAttendance) {
                    await existingAttendance.update({
                        status: 'permission',
                        notes: 'Approved Leave: ' + reason,
                        retreat_event_id: existingAttendance.retreat_event_id || retreatId,
                        seating_row_id: profile ? profile.seating_row_id : existingAttendance.seating_row_id,
                        seat_number: profile ? profile.seat_number : existingAttendance.seat_number,
                        kut_id: profile ? profile.kut_id : existingAttendance.kut_id
                    });
                } else {
                    await Attendance.create({
                        user_id: req.user.id,
                        retreat_event_id: retreatId,
                        date: dateStr,
                        status: 'permission',
                        notes: 'Approved Leave: ' + reason,
                        seating_row_id: profile ? profile.seating_row_id : null,
                        seat_number: profile ? profile.seat_number : null,
                        kut_id: profile ? profile.kut_id : null
                    });
                }
            }
        }

        res.status(201).json({ message: 'Leave request submitted successfully', leaveRequest });
        
        try {
            const { emitToAdmins } = require('../config/socket');
            emitToAdmins('new_leave_request', {
                id: leaveRequest.id,
                user_id: req.user.id,
                start_date,
                end_date,
                status
            });
        } catch (e) {
            console.error('Socket emit error:', e);
        }

        // --- TELEGRAM NOTIFICATION ---
        try {
            if (telegramBot) {
                const { Op } = require('sequelize');
                
                const monkProfile = await UserProfile.findOne({ 
                    where: { user_id: req.user.id },
                    include: [{ model: require('../models').Kut }]
                });
                const monkName = monkProfile ? `${monkProfile.first_name_kh} ${monkProfile.last_name_kh}` : `User ID ${req.user.id}`;
                
                const sDate = new Date(start_date);
                const eDate = new Date(end_date);
                const diffDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
                
                let kutIdStr = monkProfile && monkProfile.Kut ? monkProfile.Kut.name : (monkProfile && monkProfile.kut_id ? monkProfile.kut_id : 'N/A');
                let mekudiNameStr = 'N/A';
                
                let targetAdmins = [];

                if (monkProfile && monkProfile.kut_id) {
                    // Find the Admins(2) and Mekudis(3) assigned to this Kuti who have linked Telegram
                    // ✅ Added role_id 3 (Mekudi/Kudi Admin) — they are the same person in a kudi
                    const targetMekudis = await User.findAll({
                        where: { 
                            role_id: { [Op.in]: [2, 3] }, 
                            telegram_chat_id: { [Op.not]: null } 
                        },
                        include: [{ 
                            model: UserProfile, 
                            where: { kut_id: monkProfile.kut_id } 
                        }]
                    });
                    
                    if (targetMekudis.length > 0) {
                        if (targetMekudis[0].UserProfile) {
                            mekudiNameStr = `${targetMekudis[0].UserProfile.first_name_kh} ${targetMekudis[0].UserProfile.last_name_kh}`;
                        }
                        targetAdmins.push(...targetMekudis);
                    }
                }

                if (targetAdmins.length > 0) {
                    // ✅ Improved message: 1, 2, 3... days summary for easy reading
                    const phoneStr = monkProfile && monkProfile.phone_number ? monkProfile.phone_number : 'N/A';
                    const dayLabel = diffDays === 1 ? '1 ថ្ងៃ (1 day)' : `${diffDays} ថ្ងៃ (${diffDays} days)`;
                    
                    const message = 
                        `🔔 <b>សំណើរសុំច្បាប់ថ្មី (New Leave Request)</b>\n\n` +
                        `<b>ព្រះ/គ្រូ:</b> ${monkName}\n` +
                        `<b>ក្រុដិ (Kudi):</b> ${kutIdStr}\n` +
                        `<b>Mekudi:</b> ${mekudiNameStr}\n` +
                        `<b>ទូរស័ព្ទ:</b> ${phoneStr}\n\n` +
                        `<b>ចាប់ពី (Start):</b> ${start_date}\n` +
                        `<b>រហូតដល់ (End):</b> ${end_date}\n` +
                        `<b>ចំនួនថ្ងៃសរុប (Total):</b> <b>${dayLabel}</b>\n\n` +
                        `<b>មូលហេតុ (Reason):</b>\n${reason}`;

                    
                    const fs = require('fs');
                    const path = require('path');
                    let photoPath = null;
                    if (leaveRequest.image_url) {
                        photoPath = path.join(__dirname, '..', leaveRequest.image_url);
                        if (!fs.existsSync(photoPath)) photoPath = null;
                    }

                    for (const admin of targetAdmins) {
                        const options = {
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: '✅ Approve', callback_data: `approve_${leaveRequest.id}` },
                                        { text: '❌ Reject', callback_data: `reject_${leaveRequest.id}` }
                                    ]
                                ]
                            }
                        };
                        
                        if (photoPath) {
                            telegramBot.sendPhoto(admin.telegram_chat_id, photoPath, { ...options, caption: message }).catch(err => console.error('Telegram sendPhoto error:', err.message));
                        } else {
                            telegramBot.sendMessage(admin.telegram_chat_id, message, options).catch(err => console.error('Telegram send error:', err.message));
                        }
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
        console.error('Error fetching my requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Monks: Update a leave request
exports.updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, reason } = req.body;

        const leaveRequest = await LeaveRequest.findOne({ where: { id, user_id: req.user.id } });

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leaveRequest.status === 'approved' || leaveRequest.status === 'rejected') {
            return res.status(400).json({ message: `Cannot edit a request that is already ${leaveRequest.status}` });
        }

        // Check for overlapping leave requests excluding this one within the same event
        const { Op } = require('sequelize');
        const overlappingRequest = await LeaveRequest.findOne({
            where: {
                id: { [Op.ne]: id },
                user_id: req.user.id,
                status: { [Op.notIn]: ['rejected'] },
                retreat_event_id: leaveRequest.retreat_event_id,
                [Op.and]: [
                    { start_date: { [Op.lte]: end_date } },
                    { end_date: { [Op.gte]: start_date } }
                ]
            }
        });

        if (overlappingRequest) {
            return res.status(400).json({ message: 'You already have a leave request during this period.' });
        }

        let image_url = leaveRequest.image_url;
        if (req.file) {
            image_url = `/uploads/leave-requests/${req.file.filename}`;
        }

        await leaveRequest.update({ start_date, end_date, reason, image_url });

        res.json({ message: 'Leave request updated successfully', leaveRequest });
    } catch (error) {
        console.error('Error updating leave request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Monks: Delete a leave request
exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const leaveRequest = await LeaveRequest.findOne({ where: { id, user_id: req.user.id } });

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        if (leaveRequest.status === 'approved') {
            return res.status(400).json({ message: 'Cannot delete an approved leave request' });
        }

        await leaveRequest.destroy();
        res.json({ message: 'Leave request deleted successfully' });
    } catch (error) {
        console.error('Error deleting leave request:', error);
        res.status(500).json({ message: 'Internal server error' });
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
                const uRole = role.replace(/\s+/g, '').toUpperCase();
                if (uRole === 'SUPERADMIN') {
                    whereClause.status = 'pending_superadmin';
                } else if (['ADMIN', 'MEKUDI', 'ATTENDANCETAKER'].includes(uRole)) {
                    whereClause.status = { [Op.or]: ['pending', 'pending_mekudi'] };
                } else {
                    whereClause.status = { [Op.or]: ['pending', 'pending_mekudi', 'pending_superadmin'] };
                }
            } else if (status === 'approved') {
                const role = req.user?.Role?.name || req.user?.role || '';
                const uRole = role.replace(/\s+/g, '').toUpperCase();
                if (['ADMIN', 'MEKUDI', 'ATTENDANCETAKER'].includes(uRole)) {
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
            if (role.replace(/\s+/g, '').toUpperCase() === 'SUPERADMIN') {
                const { Op } = require('sequelize');
                whereClause.status = { [Op.notIn]: ['pending', 'pending_mekudi'] };
            }
        }

        const includeUser = {
            model: User,
            attributes: ['id'],
            include: [{ 
                model: UserProfile, 
                attributes: ['first_name_kh', 'last_name_kh', 'kut_id', 'avatar_url'],
                include: [{ model: require('../models').Kut, attributes: ['name'] }]
            }]
        };

        const role = req.user?.Role?.name || req.user?.role || '';
        if (['MEKUDI', 'ADMIN'].includes(role.replace(/\s+/g, '').toUpperCase()) && req.user.UserProfile?.kut_id) {
            includeUser.required = true;
            includeUser.include[0].where = { kut_id: req.user.UserProfile.kut_id };
        } else if (role.replace(/\s+/g, '').toUpperCase() === 'ATTENDANCETAKER') {
            const { SeatingRow } = require('../models');
            const { Op } = require('sequelize');
            const myRows = await SeatingRow.findAll({ where: { assigned_taker_id: req.user.id } });
            const myRowIds = myRows.map(r => r.id);
            
            if (myRowIds.length > 0) {
                includeUser.required = true;
                includeUser.include[0].where = { seating_row_id: { [Op.in]: myRowIds } };
            }
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
        
        // Scope check for Admin/Mekudi
        if (['ADMIN', 'MEKUDI'].includes(actorRole.replace(/\s+/g, '').toUpperCase()) && req.user.UserProfile?.kut_id) {
            const monkProfile = await UserProfile.findOne({ where: { user_id: leaveRequest.user_id } });
            if (monkProfile && monkProfile.kut_id !== req.user.UserProfile.kut_id) {
                return res.status(403).json({ message: 'You can only approve leave requests for members of your own Kudi' });
            }
        }

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
            
            let retreatId = leaveRequest.retreat_event_id;
            if (!retreatId) {
                const RetreatEvent = require('../models/RetreatEvent');
                const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
                retreatId = activeYear ? activeYear.id : 1;
            }

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                
                let existingAttendance = await Attendance.findOne({
                    where: {
                        user_id: leaveRequest.user_id,
                        date: dateStr
                    }
                });

                if (existingAttendance) {
                    await existingAttendance.update({
                        status: 'permission',
                        notes: 'Approved Leave: ' + leaveRequest.reason,
                        retreat_event_id: existingAttendance.retreat_event_id || retreatId,
                        seating_row_id: profile ? profile.seating_row_id : existingAttendance.seating_row_id,
                        seat_number: profile ? profile.seat_number : existingAttendance.seat_number,
                        kut_id: profile ? profile.kut_id : existingAttendance.kut_id
                    });
                } else {
                    await Attendance.create({
                        user_id: leaveRequest.user_id,
                        retreat_event_id: retreatId,
                        date: dateStr,
                        status: 'permission',
                        notes: 'Approved Leave: ' + leaveRequest.reason,
                        seating_row_id: profile ? profile.seating_row_id : null,
                        seat_number: profile ? profile.seat_number : null,
                        kut_id: profile ? profile.kut_id : null
                    });
                }
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

        res.json({ message: workflow.message, leaveRequest });

        // --- TELEGRAM NOTIFICATION TO MONK ---
        try {
            if (telegramBot) {
                const monkUser = await User.findByPk(leaveRequest.user_id);
                if (monkUser && monkUser.telegram_chat_id) {
                    const statusEmoji = workflow.nextStatus === 'approved' ? '✅' : (workflow.nextStatus === 'rejected' ? '❌' : '⏳');
                    let statusText = workflow.nextStatus.toUpperCase();
                    if (workflow.nextStatus === 'pending_superadmin') statusText = 'PENDING SUPER ADMIN APPROVAL';
                    
                    const sDate = new Date(leaveRequest.start_date);
                    const eDate = new Date(leaveRequest.end_date);
                    const diffDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;

                    const message = `${statusEmoji} <b>Leave Request Update</b>\n\nYour leave request for <b>${diffDays} day(s)</b> is now:\n\n<b>${statusText}</b>`;
                    
                    const fs = require('fs');
                    const path = require('path');
                    let photoPath = null;
                    if (leaveRequest.image_url) {
                        photoPath = path.join(__dirname, '..', leaveRequest.image_url);
                        if (!fs.existsSync(photoPath)) photoPath = null;
                    }

                    if (photoPath) {
                        telegramBot.sendPhoto(monkUser.telegram_chat_id, photoPath, { caption: message, parse_mode: 'HTML' }).catch(err => console.error('Telegram sendPhoto error to Monk:', err.message));
                    } else {
                        telegramBot.sendMessage(monkUser.telegram_chat_id, message, { parse_mode: 'HTML' }).catch(err => console.error('Telegram send error to Monk:', err.message));
                    }
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

                    // Super Admin Notification logic...
                    const superAdmins = await User.findAll({ where: { role_id: 1, telegram_chat_id: { [Op.not]: null } } });
                    const monkProfile = await UserProfile.findOne({ 
                        where: { user_id: leaveRequest.user_id },
                        include: [{ model: require('../models').Kut }]
                    });
                    const monkNameStr = monkProfile ? `${monkProfile.first_name_kh} ${monkProfile.last_name_kh}` : `User ID ${leaveRequest.user_id}`;
                    const kutIdStr = monkProfile && monkProfile.Kut ? monkProfile.Kut.name : (monkProfile && monkProfile.kut_id ? monkProfile.kut_id : 'N/A');
                    
                    const mekudiProfile = await UserProfile.findOne({ where: { user_id: req.user.id } });
                    const mekudiNameStr = mekudiProfile ? `${mekudiProfile.first_name_kh} ${mekudiProfile.last_name_kh}` : `User ID ${req.user.id}`;

                    const sDate = new Date(leaveRequest.start_date);
                    const eDate = new Date(leaveRequest.end_date);
                    const diffDays = Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;

                    const fs = require('fs');
                    const path = require('path');
                    let photoPath = null;
                    if (leaveRequest.image_url) {
                        photoPath = path.join(__dirname, '..', leaveRequest.image_url);
                        if (!fs.existsSync(photoPath)) photoPath = null;
                    }

                    for (const sa of superAdmins) {
                        const message = `🔔 <b>Leave Request Forwarded</b>\n\n<b>Monk:</b> ${monkNameStr}\n<b>Kuti:</b> ${kutIdStr}\n<b>Forwarded By:</b> ${mekudiNameStr}\n<b>From:</b> ${diffDays} day(s)\n<b>Reason:</b> ${leaveRequest.reason}`;
                        
                        const options = {
                            parse_mode: 'HTML',
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
                            telegramBot.sendPhoto(sa.telegram_chat_id, photoPath, { ...options, caption: message }).catch((err) => {
                                console.error('Telegram sendPhoto error to SuperAdmin:', err.message);
                            });
                        } else {
                            telegramBot.sendMessage(sa.telegram_chat_id, message, options).catch((err) => {
                                console.error('Telegram send error to SuperAdmin:', err.message);
                            });
                        }
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
