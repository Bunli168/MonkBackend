const { Commune } = require('../models');

const communeController = {
  async getAll(req, res) {
    try {
      const { district_id } = req.query;
      const where = district_id ? { district_id } : {};
      const communes = await Commune.findAll({
        where,
        order: [['name', 'ASC']]
      });
      res.status(200).json({ success: true, data: communes });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const commune = await Commune.findByPk(id);
      if (!commune) {
        return res.status(404).json({ success: false, message: 'Commune not found' });
      }
      res.status(200).json({ success: true, data: commune });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const commune = await Commune.create(req.body);
      res.status(201).json({ success: true, message: 'Commune created successfully', data: commune });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const commune = await Commune.findByPk(id);
      if (!commune) {
        return res.status(404).json({ success: false, message: 'Commune not found' });
      }
      await commune.update(req.body);
      res.status(200).json({ success: true, message: 'Commune updated successfully', data: commune });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const commune = await Commune.findByPk(id);
      if (!commune) {
        return res.status(404).json({ success: false, message: 'Commune not found' });
      }
      await commune.destroy();
      res.status(200).json({ success: true, message: 'Commune deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = communeController;
