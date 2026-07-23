const kutService = require('../services/kutService');

const kutController = {
  async getAll(req, res) {
    try {
      const kuts = await kutService.getAllKuts();
      res.status(200).json({ success: true, data: kuts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const kut = await kutService.getKutById(id);
      res.status(200).json({ success: true, data: kut });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const kut = await kutService.createKut(req.body);
      res.status(201).json({ success: true, message: 'Kut created', data: kut });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const kut = await kutService.updateKut(id, req.body);
      res.status(200).json({ success: true, message: 'Kut updated', data: kut });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await kutService.deleteKut(id);
      res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = kutController;
