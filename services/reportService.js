const { Report, Kut, User, ReportCategory, UserProfile } = require('../models');

const reportService = {
  formatReport(reportInstance) {
    if (!reportInstance) return null;
    const report = reportInstance.toJSON ? reportInstance.toJSON() : reportInstance;
    
    if (report.Reporter) {
      const u = report.Reporter;
      let firstName = u.UserProfile?.first_name_en || u.UserProfile?.first_name_kh || '';
      let lastName = u.UserProfile?.last_name_en || u.UserProfile?.last_name_kh || '';
      if (!firstName && !lastName && u.email) {
        const [localPart] = u.email.split('@');
        const nameParts = localPart.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1));
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      report.reporter = {
        id: u.id,
        email: u.email,
        firstName,
        lastName,
        avatarUrl: u.UserProfile?.avatar_url || null
      };
      delete report.Reporter;
    }
    return report;
  },

  async submitReport(reportData) {
    return await Report.create(reportData);
  },

  async getReportById(id, userRole, userId) {
    const report = await Report.findByPk(id, {
      include: [
        { model: Kut },
        { 
          model: User, 
          as: 'Reporter',
          include: [{ model: UserProfile }] 
        },
        { model: ReportCategory, as: 'category' }
      ]
    });
    if (!report) throw new Error('Report not found');
    
    // Authorization check
    if (userRole === 'Monk' || userRole === 'Student') {
      if (report.reported_by !== userId) throw new Error('Unauthorized access to report');
    }
    
    return this.formatReport(report);
  },

  async getAllReports(userRole, userId, query = {}) {
    const { Op } = require('sequelize');
    const include = [
      { model: Kut },
      { 
        model: User, 
        as: 'Reporter',
        include: [{ model: UserProfile }] 
      },
      { model: ReportCategory, as: 'category' }
    ];
    
    let whereClause = {};
    
    // Filtering
    if (query.status && query.status !== 'all') {
      whereClause.status = query.status;
    }
    if (query.category_id && query.category_id !== 'all') {
      whereClause.category_id = query.category_id;
    }
    if (query.search) {
      whereClause.title = { [Op.like]: `%${query.search}%` };
    }

    // Role-based Access Control
    if (userRole === 'SuperAdmin') {
      whereClause.kut_id = null;
    } else if (userRole === 'Admin') {
      const userProfile = await UserProfile.findOne({ where: { user_id: userId } });
      if (userProfile && userProfile.kut_id) {
        whereClause.kut_id = userProfile.kut_id;
      } else {
        whereClause.kut_id = null;
      }
    } else {
      // Monk and Student only see their own reports
      whereClause.reported_by = userId;
    }
    
    // Pagination and Sorting
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    
    let order = [['submitted_at', 'DESC']];
    if (query.sortBy && query.sortOrder) {
        const sortBy = query.sortBy === 'createdAt' ? 'submitted_at' : query.sortBy;
        order = [[sortBy, query.sortOrder.toUpperCase()]];
    }

    const result = await Report.findAndCountAll({
      where: whereClause,
      include,
      order,
      limit,
      offset
    });

    return {
      count: result.count,
      rows: result.rows.map(r => this.formatReport(r))
    };
  },

  async updateReportStatus(id, status) {
    const report = await Report.findByPk(id);
    if (!report) throw new Error('Report not found');
    return await report.update({ status });
  }
};

module.exports = reportService;