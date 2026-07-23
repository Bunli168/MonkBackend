const { Attendance, User, Kut, UserProfile, SeatingRow, Role, Payment, FinePayment, LeaveRequest, RetreatEvent } = require('../models');
const { emitToAdmins } = require('../config/socket');
const { Op } = require('sequelize');

const attendanceController = {
  async getAll(req, res) {
    try {
      const { date, kut_id, user_id, status, retreat_event_id } = req.query;
      const where = {};
      
      let activeYearId = retreat_event_id;
      if (!activeYearId) {
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        activeYearId = activeYear ? activeYear.id : null;
      }
      if (activeYearId) {
        where.retreat_event_id = activeYearId;
      }
      
      // Role-based access control for fetching attendances
      const userRole = req.user.Role ? req.user.Role.name : null;
      const isAdminOrTaker = ['SuperAdmin', 'Admin', 'AttendanceTaker', 'Mekudi'].includes(userRole);
      
      if (!isAdminOrTaker) {
        // Regular users can ONLY see their own attendance
        where.user_id = req.user.id;
      } else if (user_id) {
        // Admins can filter by user_id
        where.user_id = user_id;
      }

      if (date) where.date = date;
      if (kut_id) where.kut_id = kut_id;
      if (status) where.status = status;
      
      const attendances = await Attendance.findAll({
        where,
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });
      
      res.status(200).json({ success: true, data: attendances });
    } catch (error) {
      console.error('Get all attendances error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const attendance = await Attendance.findByPk(id);
      
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      
      res.status(200).json({ success: true, data: attendance });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const { user_id, kut_id, date, status, notes, seating_row_id, seat_number, fine_amount } = req.body;
      
      // Check if attendance already exists for this user on this date
      const existing = await Attendance.findOne({
        where: { user_id, date }
      });
      
      if (existing) {
        return res.status(400).json({ success: false, message: 'Attendance already exists for this user on this date' });
      }
      
      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
      if (activeYear) {
        if (activeYear.is_closed) {
          return res.status(400).json({ success: false, message: 'The current season is closed. You cannot record or update attendance.' });
        }
        if (activeYear.end_date) {
          const endDate = new Date(activeYear.end_date);
          const today = new Date();
          endDate.setHours(23, 59, 59, 999);
          if (today > endDate) {
            return res.status(400).json({ success: false, message: 'The current season has ended based on its end date. You cannot record or update attendance.' });
          }
        }
      }
      const activeYearId = activeYear ? activeYear.id : null;
      
      // Enforce leave request status
      const { Op } = require('sequelize');
      const overlappingRequest = await LeaveRequest.findOne({
        where: {
          user_id,
          status: { [Op.notIn]: ['rejected'] },
          start_date: { [Op.lte]: date },
          end_date: { [Op.gte]: date }
        }
      });
      
      const finalStatus = overlappingRequest ? 'permission' : (status || 'present');
      const finalNotes = overlappingRequest ? (overlappingRequest.reason || 'Leave requested') : notes;

      const attendance = await Attendance.create({
        user_id,
        kut_id,
        date,
        status: finalStatus,
        notes: finalNotes,
        seating_row_id,
        seat_number,
        fine_amount: fine_amount || 0.00,
        retreat_event_id: activeYearId
      });
      
      res.status(201).json({ success: true, message: 'Attendance created successfully', data: attendance });
    } catch (error) {
      console.error('Create attendance error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const attendance = await Attendance.findByPk(id);
      
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      
      // Enforce leave request status
      const { Op } = require('sequelize');
      const overlappingRequest = await LeaveRequest.findOne({
        where: {
          user_id: attendance.user_id,
          status: { [Op.notIn]: ['rejected'] },
          start_date: { [Op.lte]: attendance.date },
          end_date: { [Op.gte]: attendance.date }
        }
      });

      const updateData = { ...req.body };
      if (overlappingRequest) {
        updateData.status = 'permission';
        updateData.notes = overlappingRequest.reason || 'Leave requested';
      }

      await attendance.update(updateData);
      res.status(200).json({ success: true, message: 'Attendance updated successfully', data: attendance });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const attendance = await Attendance.findByPk(id);
      
      if (!attendance) {
        return res.status(404).json({ success: false, message: 'Attendance not found' });
      }
      
      await attendance.destroy();
      res.status(200).json({ success: true, message: 'Attendance deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getMonksByDate(req, res) {
    try {
      const { date, retreat_event_id } = req.query;
      
      if (!date) {
        return res.status(400).json({ success: false, message: 'date is required' });
      }

      let activeYearId = retreat_event_id;
      if (!activeYearId) {
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        activeYearId = activeYear ? activeYear.id : null;
      }
      
      const eventFilter = activeYearId ? { retreat_event_id: activeYearId } : {};

      // Get all users (monks/bhikkhus)
      // Filter out users who were created AFTER the selected date
      const queryDate = new Date(date);
      queryDate.setHours(23, 59, 59, 999);
      
      const { Op } = require('sequelize');
      const users = await User.findAll({
        where: {
          created_at: { [Op.lte]: queryDate }
        },
        attributes: ['id', 'email', 'phone', 'role_id'],
        include: [
          { model: Role, attributes: ['name'] },
          {
            model: UserProfile,
            attributes: ['kut_id', 'seat_number', 'seating_row_id', 'first_name_kh', 'last_name_kh', 'first_name_en', 'last_name_en'],
            include: [
              { model: Kut, attributes: ['id', 'name'] },
              { model: SeatingRow, attributes: ['id', 'row_num'] }
            ]
          },
          {
            model: Attendance,
            attributes: ['status'],
            where: { status: { [Op.in]: ['absent', 'permission'] }, ...eventFilter },
            required: false
          },
          {
            model: Payment,
            attributes: ['amount_paid'],
            where: eventFilter,
            required: false
          }
        ]
      });
      
      // Get existing attendance for this date
      const attendances = await Attendance.findAll({
        where: { date, ...eventFilter },
        attributes: ['id', 'user_id', 'status', 'notes']
      });
      
      // Get pending or approved leave requests for this date
      const leaveRequests = await LeaveRequest.findAll({
        where: {
          start_date: { [Op.lte]: date },
          end_date: { [Op.gte]: date },
          status: { [Op.notIn]: ['rejected'] },
          ...eventFilter
        },
        attributes: ['user_id', 'status', 'reason']
      });

      // Map attendance status to users
      const attendanceMap = {};
      attendances.forEach(att => {
        attendanceMap[att.user_id] = {
          id: att.id,
          status: att.status,
          notes: att.notes,
          isSubmitted: true
        };
      });
      
      // Override or inject leave request status as permission
      leaveRequests.forEach(lr => {
        if (!attendanceMap[lr.user_id] || attendanceMap[lr.user_id].status !== 'permission') {
          attendanceMap[lr.user_id] = {
            id: attendanceMap[lr.user_id]?.id || null,
            status: 'permission',
            notes: lr.reason || 'Leave requested',
            isSubmitted: true
          };
        }
      });
      
      const result = users.map(user => {
        const profile = user.UserProfile;
        const nameParts = profile
          ? [profile.first_name_kh || profile.first_name_en, profile.last_name_kh || profile.last_name_en]
          : [user.email];
        const fullName = nameParts.filter(Boolean).join(' ').trim();

        // Calculate netAbsents
        let totalAbsent = 0;
        let totalPermission = 0;
        if (user.Attendances) {
            user.Attendances.forEach(att => {
                if (att.status === 'absent') totalAbsent++;
                if (att.status === 'permission') totalPermission++;
            });
        }
        const grossAbsents = totalAbsent + Math.floor(totalPermission / 3);
        let clearedAbsents = 0;
        if (user.Payments) {
            const totalPaid = user.Payments.reduce((sum, p) => sum + parseFloat(p.amount_paid), 0);
            clearedAbsents = Math.floor(totalPaid / 5) * 3;
        }
        const netAbsents = grossAbsents - clearedAbsents;

        return {
          ...user.toJSON(),
          fullName: fullName || user.email,
          netAbsents,
          kudiNumber: profile?.kut_id || profile?.Kut?.name || null,
          rowNumber: profile?.SeatingRow?.row_num || null,
          seatNumber: profile?.seat_number || null,
          profile: profile ? {
            ...profile.toJSON(),
            kut: profile.Kut || null,
            seatingRow: profile.SeatingRow || null
          } : null,
          attendance: attendanceMap[user.id] || null,
          role: user.Role ? user.Role.name : 'Unknown'
        };
      });
      
      // Sort so that Bhikkhu comes before Monk
      result.sort((a, b) => {
        const roleA = a.role.toUpperCase();
        const roleB = b.role.toUpperCase();
        if (roleA.includes('BHIKKHU') && !roleB.includes('BHIKKHU')) return -1;
        if (!roleA.includes('BHIKKHU') && roleB.includes('BHIKKHU')) return 1;
        // Secondary sort by seat number
        const seatA = parseInt(a.seatNumber) || 999;
        const seatB = parseInt(b.seatNumber) || 999;
        return seatA - seatB;
      });
      
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Get monks by kut and date error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async bulkCreate(req, res) {
    try {
      const { attendances } = req.body; // Array of { user_id, kut_id, date, status, notes }
      
      if (!Array.isArray(attendances) || attendances.length === 0) {
        return res.status(400).json({ success: false, message: 'attendances array is required' });
      }
      
      const results = [];
      
      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
      if (activeYear) {
        if (activeYear.is_closed) {
          return res.status(400).json({ success: false, message: 'The current season is closed. You cannot record or update attendance.' });
        }
        if (activeYear.end_date) {
          const endDate = new Date(activeYear.end_date);
          const today = new Date();
          endDate.setHours(23, 59, 59, 999);
          if (today > endDate) {
            return res.status(400).json({ success: false, message: 'The current season has ended based on its end date. You cannot record or update attendance.' });
          }
        }
      }
      const activeYearId = activeYear ? activeYear.id : null;
      
      for (const att of attendances) {
        const { user_id, kut_id, date, status, notes, seating_row_id, seat_number, fine_amount } = att;
        
        // Enforce leave request status
        const { Op } = require('sequelize');
        const overlappingRequest = await LeaveRequest.findOne({
          where: {
            user_id,
            status: { [Op.notIn]: ['rejected'] },
            start_date: { [Op.lte]: date },
            end_date: { [Op.gte]: date }
          }
        });
        
        const finalStatus = overlappingRequest ? 'permission' : (status || 'present');
        const finalNotes = overlappingRequest ? (overlappingRequest.reason || 'Leave requested') : notes;

        // Check if attendance already exists
        const existing = await Attendance.findOne({
          where: { user_id, date }
        });
        
        if (existing) {
          // Update existing
          await existing.update({ 
            status: finalStatus, 
            notes: finalNotes, 
            seating_row_id, 
            seat_number, 
            fine_amount, 
            retreat_event_id: activeYearId 
          });
          results.push(existing);
        } else {
          // Create new
          const newAtt = await Attendance.create({
            user_id,
            kut_id,
            date,
            status: finalStatus,
            notes: finalNotes,
            seating_row_id,
            seat_number,
            fine_amount: fine_amount || 0.00,
            retreat_event_id: activeYearId
          });
          results.push(newAtt);
        }
      }
      
      res.status(201).json({ success: true, message: 'Attendance created/updated successfully', data: results });
    } catch (error) {
      console.error('Bulk create attendance error:', error);
      require('fs').writeFileSync('/tmp/err.log', error.message + '\n' + (error.stack || ''));
      res.status(400).json({ success: false, message: error.message, stack: error.stack });
    }
  },

  async deleteByKutAndDate(req, res) {
    try {
      const { kut_id, date } = req.query;
      
      if (!kut_id || !date) {
        return res.status(400).json({ success: false, message: 'kut_id and date are required' });
      }
      
      const deletedCount = await Attendance.destroy({
        where: { kut_id, date }
      });
      
      res.status(200).json({ success: true, message: `Successfully deleted ${deletedCount} attendance records for the selected date.` });
    } catch (error) {
      console.error('Delete by kut and date error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async submitLeaveRequest(req, res) {
    try {
      const { user_id, kut_id, date, notes } = req.body;
      
      if (!user_id || !kut_id || !date) {
        return res.status(400).json({ success: false, message: 'user_id, kut_id, and date are required' });
      }

      const { Op } = require('sequelize');
      const overlappingRequest = await LeaveRequest.findOne({
        where: {
          user_id,
          status: { [Op.notIn]: ['rejected'] },
          start_date: { [Op.lte]: date },
          end_date: { [Op.gte]: date }
        }
      });
      
      if (overlappingRequest) {
        return res.status(400).json({ success: false, message: 'You already have a leave request for this date.' });
      }

      const { RetreatEvent } = require('../models');
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });

      const leaveRequest = await LeaveRequest.create({
        user_id,
        retreat_event_id: activeYear ? activeYear.id : null,
        start_date: date,
        end_date: date,
        reason: notes || 'Leave request',
        status: 'pending_mekudi'
      });
      
      // DO NOT create or update the Attendance record here!
      // Attendance records should only be created/updated when the Admin/SuperAdmin APPROVES the leave request.
      
      // The prompt also mentioned: "queues an alert data payload" (Simulated Telegram Alert)
      console.log(`[TELEGRAM ALERT SIMULATION] Monk ID ${user_id} requested leave for ${date}. Reason: ${notes}`);

      try {
        emitToAdmins('new_leave_request', {
          id: leaveRequest.id,
          user_id,
          status: leaveRequest.status,
          message: 'New leave request needs approval',
          createdAt: leaveRequest.createdAt
        });
      } catch (notifyErr) {
        console.warn('Leave notification emit failed:', notifyErr.message);
      }
      
      res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: { leaveRequest } });
    } catch (error) {
      console.error('Submit leave request error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAdminSummary(req, res) {
    try {
      const { RetreatEvent, LeaveRequest, Role, Payment } = require('../models');
      const { Op } = require('sequelize');
      const { retreat_event_id } = req.query;
      let activeYearId = retreat_event_id;
      if (!activeYearId) {
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        activeYearId = activeYear ? activeYear.id : null;
      }
      
      const attendanceWhere = activeYearId ? { retreat_event_id: activeYearId } : {};
      const paymentWhere = activeYearId ? { retreat_event_id: activeYearId } : {};

      // Find all users and join UserProfile, Kut, and Attendances
      const users = await User.findAll({
        attributes: ['id', 'email', 'phone'],
        include: [
          {
            model: UserProfile,
            attributes: ['kut_id', 'seating_row_id', 'seat_number', 'first_name_kh', 'last_name_kh', 'first_name_en', 'last_name_en', 'phone_number'],
            include: [
              { model: Kut, attributes: ['name'] },
              { model: SeatingRow, attributes: ['row_num'] }
            ]
          },
          {
            model: Attendance,
            attributes: ['status', 'fine_amount'],
            where: attendanceWhere,
            required: false
          },
          {
            model: Role,
            attributes: ['name']
          },
          {
            model: Payment,
            attributes: ['amount_paid'],
            where: paymentWhere,
            required: false
          },
          {
            model: LeaveRequest,
            attributes: ['status'],
            where: {
              ...attendanceWhere,
              status: { [Op.in]: ['pending_mekudi', 'approved_mekudi'] }
            },
            required: false
          }
        ]
      });

      const result = users.map(user => {
        const profile = user.UserProfile;
        const nameParts = profile
          ? [profile.first_name_kh || profile.first_name_en, profile.last_name_kh || profile.last_name_en]
          : [user.email];
        const fullName = nameParts.filter(Boolean).join(' ').trim();
        const phoneNumber = profile?.phone_number || user.phone || 'N/A';
        const kudiNumber = profile?.Kut?.name || profile?.kut_id || 'N/A';
        const rowNumber = profile?.SeatingRow?.row_num || 'N/A';
        const seatNumber = profile?.seat_number || 'N/A';
        
        let absentCount = 0;
        let permissionCount = 0;
        
        if (user.Attendances && user.Attendances.length > 0) {
          user.Attendances.forEach(att => {
            if (att.status === 'absent') absentCount++;
            if (att.status === 'permission') permissionCount++;
          });
        }
        
        let pendingLeavesCount = 0;
        if (user.LeaveRequests && user.LeaveRequests.length > 0) {
          pendingLeavesCount = user.LeaveRequests.length;
        }
        
        // Fine rule: 3 permissions = 1 absent, 3 absents = 5 dollars
        const effectiveAbsents = absentCount + Math.floor(permissionCount / 3);
        const grossFine = Math.floor(effectiveAbsents / 3) * 5;
        
        let totalPaid = 0;
        if (user.Payments && user.Payments.length > 0) {
          user.Payments.forEach(pay => {
            if (pay.amount_paid) totalPaid += parseFloat(pay.amount_paid);
          });
        }
        
        let netFine = grossFine - totalPaid;
        if (netFine < 0) netFine = 0;
        
        return {
          id: user.id,
          name: fullName || user.email,
          role: user.Role ? user.Role.name : 'Unknown',
          phone: phoneNumber,
          kudiNumber: kudiNumber,
          rowNumber: rowNumber,
          seatNumber: seatNumber,
          absent: absentCount,
          permission: permissionCount,
          pendingLeaves: pendingLeavesCount,
          fine: netFine,
          grossFine: grossFine,
          totalPaid: totalPaid
        };
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Get admin summary error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getMySummary(req, res) {
    try {
      const userId = req.user.id;

      const { retreat_event_id } = req.query;
      let activeYearId = retreat_event_id;
      if (!activeYearId) {
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        activeYearId = activeYear ? activeYear.id : null;
      }
      const attendanceWhere = activeYearId ? { user_id: userId, retreat_event_id: activeYearId } : { user_id: userId };

      let attendances;
      try {
        attendances = await Attendance.findAll({
          where: attendanceWhere,
          attributes: ['status', 'fine_amount']
        });
      } catch (error) {
        if (error?.name === 'SequelizeDatabaseError' || /unknown column|does not have column/i.test(error?.message || '')) {
          attendances = await Attendance.findAll({
            where: attendanceWhere,
            attributes: ['status']
          });
        } else {
          throw error;
        }
      }

      let absentCount = 0;
      let permissionCount = 0;
      let totalFine = 0;

      attendances.forEach(att => {
        if (att.status === 'absent') absentCount++;
        if (att.status === 'permission') permissionCount++;

        const fineValue = att.fine_amount;
        if (fineValue !== undefined && fineValue !== null && fineValue !== '') {
          totalFine += parseFloat(fineValue);
        }
      });

      res.status(200).json({
        success: true,
        data: {
          absent: absentCount,
          permission: permissionCount,
          fine: totalFine
        }
      });
    } catch (error) {
      console.error('Get my summary error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = attendanceController;
