const { ReportCategory } = require('../models');

const reportCategoryService = {
  async createCategory(data) {
    return await ReportCategory.create(data);
  },

  async getAllCategories(query = {}) {
    const { search, sortDir = 'desc', page = 1, limit = 12 } = query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.name = { [require('sequelize').Op.like]: `%${search}%` };
    }

    const { count, rows } = await ReportCategory.findAndCountAll({
      where,
      order: [['createdAt', sortDir.toUpperCase()]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });

    return {
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10)
      }
    };
  },

  async getCategoryById(id) {
    const category = await ReportCategory.findByPk(id);
    if (!category) throw new Error('Category not found');
    return category;
  },

  async updateCategory(id, data) {
    const category = await ReportCategory.findByPk(id);
    if (!category) throw new Error('Category not found');
    return await category.update(data);
  },

  async deleteCategory(id) {
    const category = await ReportCategory.findByPk(id);
    if (!category) throw new Error('Category not found');
    await category.destroy();
    return true;
  }
};

module.exports = reportCategoryService;
