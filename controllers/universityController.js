const { University } = require('../models');

const universityController = {
  async getAll(req, res) {
    try {
      const universities = await University.findAll({
        order: [['name', 'ASC']]
      });
      res.status(200).json({ success: true, data: universities });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const { name, province, district, commune, village, website, email, tel, rector, establish_date, faculties, language } = req.body;
      const university = await University.create({ name, province, district, commune, village, website, email, tel, rector, establish_date, faculties, language });
      res.status(201).json({ success: true, message: 'University created', data: university });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const university = await University.findByPk(id);
      if (!university) return res.status(404).json({ success: false, message: 'University not found' });
      const { name, province, district, commune, village, website, email, tel, rector, establish_date, faculties, language } = req.body;
      await university.update({ name, province, district, commune, village, website, email, tel, rector, establish_date, faculties, language });
      res.status(200).json({ success: true, message: 'University updated', data: university });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const university = await University.findByPk(id);
      if (!university) return res.status(404).json({ success: false, message: 'University not found' });
      await university.destroy();
      res.status(200).json({ success: true, message: 'University deleted' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = universityController;
