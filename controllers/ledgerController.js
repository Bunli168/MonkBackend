const { User, Attendance, Payment, UserProfile, RetreatEvent } = require('../models');
const { Op } = require('sequelize');

const ledgerController = {
  async getLedger(req, res) {
    try {
      let activeYearId = req.query.retreat_event_id;
      
      if (!activeYearId) {
        const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
        activeYearId = activeYear ? activeYear.id : null;
      }
      
      const attendanceWhere = activeYearId ? { retreat_event_id: activeYearId } : {};
      const paymentWhere = activeYearId ? { retreat_event_id: activeYearId } : {};

      // Get all users who are monks (or just all users for now)
      const users = await User.findAll({
        attributes: ['id', 'email', 'phone'],
        include: [
          {
            model: UserProfile,
            attributes: ['first_name_kh', 'last_name_kh', 'seating_row_id']
          },
          {
            model: Attendance,
            attributes: ['status'],
            where: attendanceWhere,
            required: false
          },
          {
            model: Payment,
            attributes: ['amount_paid'],
            where: paymentWhere,
            required: false
          }
        ]
      });

      const ledger = users.map(user => {
        let totalAbsences = 0;
        let totalPermissions = 0;

        user.Attendances.forEach(att => {
          if (att.status === 'absent') totalAbsences += 1;
          if (att.status === 'permission') totalPermissions += 1;
        });

        // 1 Permission = 1 Point | 1 Absent = 2 Points.
        const pointsEarned = totalPermissions + (totalAbsences * 2);

        // Sum total payments
        let totalMoneyPaid = 0;
        user.Payments.forEach(pay => {
          totalMoneyPaid += parseFloat(pay.amount_paid);
        });

        // 1 Fine payment ($5) clears exactly 9 points.
        const pointsCleared = Math.floor(totalMoneyPaid / 5) * 9;
        
        let activePoints = pointsEarned - pointsCleared;
        if (activePoints < 0) activePoints = 0;

        // Fine Balance Owed Formula: Floor(Current Active Points / 6) * 5
        const fineBalanceOwed = Math.floor(activePoints / 6) * 5;

        // Status Level
        let statusLevel = 'Green';
        if (activePoints >= 9) statusLevel = 'Red';
        else if (activePoints >= 4) statusLevel = 'Yellow';

        return {
          user_id: user.id,
          name: user.UserProfile ? `${user.UserProfile.first_name_kh} ${user.UserProfile.last_name_kh}` : user.email,
          seating_row_id: user.UserProfile ? user.UserProfile.seating_row_id : null,
          total_absences: totalAbsences,
          total_permissions: totalPermissions,
          points_earned: pointsEarned,
          total_paid: totalMoneyPaid,
          points_cleared: pointsCleared,
          active_points: activePoints,
          fine_balance_owed: fineBalanceOwed,
          status_level: statusLevel
        };
      });

      res.status(200).json({ success: true, data: ledger });
    } catch (error) {
      console.error('Get ledger error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async makePayment(req, res) {
    try {
      const { user_id, amount_paid, retreat_event_id } = req.body;
      
      if (!user_id || !amount_paid) {
        return res.status(400).json({ success: false, message: 'user_id and amount_paid are required' });
      }

      // Valid amounts: 5, 10, 15
      if (![5, 10, 15].includes(parseFloat(amount_paid))) {
        return res.status(400).json({ success: false, message: 'Invalid payment amount. Must be 5, 10, or 15.' });
      }

      let activeYearId = retreat_event_id;
      if (!activeYearId) {
        const activeYear = await require('../models').RetreatEvent.findOne({ where: { is_active: true } });
        activeYearId = activeYear ? activeYear.id : null;
      }

      const payment = await Payment.create({
        user_id,
        amount_paid,
        retreat_event_id: activeYearId,
        collected_by: req.user ? req.user.id : null,
        paid_at: new Date()
      });

      res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
    } catch (error) {
      console.error('Make payment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = ledgerController;
