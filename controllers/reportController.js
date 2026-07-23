const reportService = require('../services/reportService');

const reportController = {
  // Submit a new report
  async submit(req, res) {
    try {
      const userId = req.user.id;
      // Get the kut_id from the user profile
      const userProfile = await require('../models').UserProfile.findOne({ where: { user_id: userId } });
      
      let images = [];
      if (req.body.images) {
        try {
          images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        } catch(e) {}
      }
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({ imageUrl: file.path.replace(/\\/g, '/') }));
        images = [...images, ...newImages];
      }

      // If target is super_admin, kut_id should be null
      const target = req.body.target;
      let kutId = null;
      if (target === 'kudi') {
        kutId = userProfile ? userProfile.kut_id : null;
      }

      const reportData = { 
        ...req.body, 
        content: req.body.description || req.body.content,
        images,
        reported_by: userId,
        kut_id: kutId 
      };
      const report = await reportService.submitReport(reportData);
      const userRole = req.user.Role ? req.user.Role.name : null;
      const fullReport = await reportService.getReportById(report.id, userRole, userId);
      res.status(201).json({ success: true, message: 'Report submitted', data: fullReport });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Get all reports (access depends on role)
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.Role ? req.user.Role.name : null; 
      
      console.log('getAll requested by:', { userId, userRole, query: req.query });
      const result = await reportService.getAllReports(userRole, userId, req.query);
      console.log('getAll result rows count:', result.count);
      res.status(200).json({ 

        success: true, 
        data: result.rows,
        pagination: {
          totalItems: result.count,
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get a specific report
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.Role ? req.user.Role.name : null;
      
      const report = await reportService.getReportById(id, userRole, userId);
      res.status(200).json({ success: true, data: report });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async getStats(req, res) {
    try {
      const Report = require('../models').Report;
      const { UserProfile } = require('../models');
      const userId = req.user.id;
      const userRole = req.user.Role ? req.user.Role.name : null;
      
      let whereClause = {};
      if (userRole === 'Student' || userRole === 'Monk') {
        whereClause.reported_by = userId;
      } else if (userRole === 'Admin') {
        const userProfile = await UserProfile.findOne({ where: { user_id: userId } });
        if (userProfile && userProfile.kut_id) {
          whereClause.kut_id = userProfile.kut_id;
        } else {
          whereClause.reported_by = userId;
        }
      }
      
      const stats = await Report.findAll({
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
        ],
        where: whereClause,
        group: ['status']
      });
      
      let all = 0;
      let statusStats = { all: 0, submitted: 0, reviewed: 0, resolved: 0 };
      stats.forEach(stat => {
        const count = parseInt(stat.get('count'), 10);
        statusStats[stat.status] = count;
        all += count;
      });
      statusStats.all = all;
      
      res.status(200).json({ success: true, data: statusStats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update report status (SuperAdmin only)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userRole = req.user.Role ? req.user.Role.name : null;
      
      const result = await reportService.updateReportStatus(id, status, userRole);
      res.status(200).json({ success: true, message: result.message, data: { status: result.status } });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const Report = require('../models').Report;
      const report = await Report.findByPk(id);
      if (!report) return res.status(404).json({ success: false, message: 'Not found' });
      
      const userRole = req.user.Role ? req.user.Role.name : null;
      // Allow only the owner or an admin to edit (basic check)
      if (report.reported_by !== req.user.id && !['SuperAdmin', 'Admin'].includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      
      const updateData = { ...req.body };
      delete updateData.reported_by; // Prevent changing the owner/reporter
      
      if (req.body.description !== undefined) {
        updateData.content = req.body.description;
      }

      // If target is explicitly updated
      if (req.body.target !== undefined) {
        if (req.body.target === 'kudi') {
          const userProfile = await require('../models').UserProfile.findOne({ where: { user_id: req.user.id } });
          updateData.kut_id = userProfile ? userProfile.kut_id : null;
        } else if (req.body.target === 'super_admin') {
          updateData.kut_id = null;
        }
      }
      
      let existingImages = [];
      if (req.body.images !== undefined) {
        try {
          existingImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
        } catch(e) {}
        updateData.images = existingImages;
      }
      
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({ imageUrl: file.path.replace(/\\/g, '/') }));
        updateData.images = req.body.images !== undefined ? [...existingImages, ...newImages] : [...(report.images || []), ...newImages];
      }

      await report.update(updateData);
      const fullReport = await reportService.getReportById(report.id, userRole, req.user.id);
      res.json({ success: true, data: fullReport });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const Report = require('../models').Report;
      const report = await Report.findByPk(id);
      if (!report) return res.status(404).json({ success: false, message: 'Not found' });
      
      const userRole = req.user.Role ? req.user.Role.name : null;
      if (report.reported_by !== req.user.id && !['SuperAdmin', 'Admin'].includes(userRole)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      
      await report.destroy();
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
};

module.exports = reportController;
