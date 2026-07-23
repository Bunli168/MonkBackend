const { Village } = require('../models');

const villageController = {
  async getAll(req, res) {
    try {
      const { commune_id } = req.query;
      const where = commune_id ? { commune_id } : {};
      const villages = await Village.findAll({
        where,
        order: [['name', 'ASC']]
      });
      res.status(200).json({ success: true, data: villages });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const village = await Village.findByPk(id);
      if (!village) {
        return res.status(404).json({ success: false, message: 'Village not found' });
      }
      res.status(200).json({ success: true, data: village });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const village = await Village.create(req.body);
      res.status(201).json({ success: true, message: 'Village created successfully', data: village });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const village = await Village.findByPk(id);
      if (!village) {
        return res.status(404).json({ success: false, message: 'Village not found' });
      }
      await village.update(req.body);
      res.status(200).json({ success: true, message: 'Village updated successfully', data: village });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const village = await Village.findByPk(id);
      if (!village) {
        return res.status(404).json({ success: false, message: 'Village not found' });
      }
      await village.destroy();
      res.status(200).json({ success: true, message: 'Village deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = villageController;
