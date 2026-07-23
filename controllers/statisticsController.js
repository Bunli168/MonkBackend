const { User, Report, Kut, RoomSchedule, Role } = require('../models');
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
      
      let totalReports = 0;
      let reportByStatus = { 'Pending': 0, 'In Progress': 0, 'Resolved': 0, 'Rejected': 0 };
      
      try {
          const reports = await Report.findAll({
              attributes: ['status', [require('sequelize').fn('COUNT', '*'), 'count']],
              group: ['status'],
              raw: true
          });
          
          reports.forEach(r => {
              const statusName = r.status.charAt(0).toUpperCase() + r.status.slice(1);
              reportByStatus[statusName] = parseInt(r.count, 10);
              totalReports += parseInt(r.count, 10);
          });
      } catch (e) {
          console.error("Failed to aggregate reports:", e.message);
      }
      
      let totalEvents = 0;
      if (RoomSchedule) {
          totalEvents = await RoomSchedule.count();
      }

      const stats = {
        userStats: { total: totalUsers, growth: 5 },
        roomStats: { total: totalRooms, growth: 2 },
        reportStats: { 
            total: totalReports, 
            growth: 8, 
            monthlyReportComparison: [
                { month: 'Jan', count: 2 },
                { month: 'Feb', count: 5 },
                { month: 'Mar', count: 8 },
                { month: 'Apr', count: 12 },
                { month: 'May', count: 15 }
            ], 
            byStatus: reportByStatus
        },
        surveyStats: { total: 0, growth: 0, monthlySurveyResponses: [] },
        scheduleStats: { total: totalEvents }
      };

      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
  }
};

module.exports = statisticsController;
