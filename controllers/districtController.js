const { District } = require('../models');

const districtController = {
  async getAll(req, res) {
    try {
      const { province_id } = req.query;
      const where = province_id ? { province_id } : {};
      const districts = await District.findAll({
        where,
        order: [['name', 'ASC']]
      });
      res.status(200).json({ success: true, data: districts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const district = await District.findByPk(id);
      if (!district) {
        return res.status(404).json({ success: false, message: 'District not found' });
      }
      res.status(200).json({ success: true, data: district });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const district = await District.create(req.body);
      res.status(201).json({ success: true, message: 'District created successfully', data: district });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const district = await District.findByPk(id);
      if (!district) {
        return res.status(404).json({ success: false, message: 'District not found' });
      }
      await district.update(req.body);
      res.status(200).json({ success: true, message: 'District updated successfully', data: district });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const district = await District.findByPk(id);
      if (!district) {
        return res.status(404).json({ success: false, message: 'District not found' });
      }
      await district.destroy();
      res.status(200).json({ success: true, message: 'District deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = districtController;
