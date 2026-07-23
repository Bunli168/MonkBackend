const reportCategoryService = require('../services/reportCategoryService');

const reportCategoryController = {
  async create(req, res) {
    try {
      const category = await reportCategoryService.createCategory(req.body);
      res.status(201).json({ success: true, message: 'Category created', data: category });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const result = await reportCategoryService.getAllCategories(req.query);
      res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const category = await reportCategoryService.getCategoryById(req.params.id);
      res.status(200).json({ success: true, data: category });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const category = await reportCategoryService.updateCategory(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Category updated', data: category });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      await reportCategoryService.deleteCategory(req.params.id);
      res.status(200).json({ success: true, message: 'Category deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = reportCategoryController;
