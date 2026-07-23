const publicContentService = require('../services/publicContentService');

const publicContentController = {
  // Get all public contents
  async getAll(req, res) {
    try {
      // If user is Admin or SuperAdmin, they can see unpublished content too (optional)
      const userRole = req.user ? req.user.role : null;
      const includeUnpublished = userRole === 'SuperAdmin' || userRole === 'Admin';
      
      const contents = await publicContentService.getAllContents(includeUnpublished);
      res.status(200).json({ success: true, data: contents });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get specific public content
  async getById(req, res) {
    try {
      const { id } = req.params;
      const content = await publicContentService.getContentById(id);
      res.status(200).json({ success: true, data: content });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  // Create public content (SuperAdmin or Admin only)
  async create(req, res) {
    try {
      const userId = req.user.id;
      const content = await publicContentService.createContent(userId, req.body);
      res.status(201).json({ success: true, message: 'Content created', data: content });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Update public content
  async update(req, res) {
    try {
      const { id } = req.params;
      const content = await publicContentService.updateContent(id, req.body);
      res.status(200).json({ success: true, message: 'Content updated', data: content });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Delete public content
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await publicContentService.deleteContent(id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = publicContentController;
