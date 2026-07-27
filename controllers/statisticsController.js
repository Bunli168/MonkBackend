const { User, Attendance, LeaveRequest, Kut, Role } = require('../models');
const { Op } = require('sequelize');

const statisticsController = {
  async getAdminStats(req, res) {
    try {
      const excludeRoles = await Role.findAll({ 
        where: { name: { [Op.in]: ['AttendanceTaker', 'SuperAdmin'] } } 
      });
      const excludeIds = excludeRoles ? excludeRoles.map(r => r.id) : [];
      
      const totalUsers = await User.count({
        where: excludeIds.length > 0 ? { role_id: { [Op.notIn]: excludeIds } } : {}
      });
      const totalRooms = await Kut.count();
      const totalAttendance = await Attendance.count();
      const totalLeaveRequests = await LeaveRequest.count();
      
      // Attendance by status
      let attendanceByStatus = { 'Present': 0, 'Absent': 0, 'Permission': 0 };
      try {
          const atts = await Attendance.findAll({
              attributes: ['status', [require('sequelize').fn('COUNT', '*'), 'count']],
              group: ['status'],
              raw: true
          });
          atts.forEach(a => {
              const statusName = a.status.charAt(0).toUpperCase() + a.status.slice(1);
              attendanceByStatus[statusName] = parseInt(a.count, 10);
          });
      } catch (e) {
          console.error("Failed to aggregate attendance:", e.message);
      }
      
      // Monthly attendance over the last 6 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyAttendanceComparison = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthlyAttendanceComparison.push({
              month: months[d.getMonth()],
              year: d.getFullYear(),
              monthIndex: d.getMonth(),
              count: 0
          });
      }

      try {
          const allAtts = await Attendance.findAll({
              attributes: ['date'],
              raw: true
          });
          
          allAtts.forEach(a => {
              if (a.date) {
                  const aDate = new Date(a.date);
                  const match = monthlyAttendanceComparison.find(m => m.monthIndex === aDate.getMonth() && m.year === aDate.getFullYear());
                  if (match) {
                      match.count += 1;
                  }
              }
          });
      } catch (e) {
          console.error("Failed to fetch monthly attendance:", e.message);
      }

      const cleanMonthlyAttendance = monthlyAttendanceComparison.map(({ month, count }) => ({ month, count }));

      // Calculate growth (or 0%)
      const currentMonthCount = monthlyAttendanceComparison[5]?.count || 0;
      const prevMonthCount = monthlyAttendanceComparison[4]?.count || 0;
      let attGrowth = 0;
      if (prevMonthCount > 0) {
          attGrowth = Math.round(((currentMonthCount - prevMonthCount) / prevMonthCount) * 100);
      } else if (currentMonthCount > 0) {
          attGrowth = 100;
      }

      const stats = {
        userStats: { total: totalUsers, growth: 0 },
        roomStats: { total: totalRooms, growth: 0 },
        attendanceStats: { 
            total: totalAttendance, 
            growth: attGrowth, 
            monthlyAttendanceComparison: cleanMonthlyAttendance, 
            byStatus: attendanceByStatus 
        },
        leaveStats: { total: totalLeaveRequests, growth: 0 }
      };

      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
  }
};

module.exports = statisticsController;
