const { Province } = require('../models');

const provinceController = {
  async getAll(req, res) {
    try {
      const provinces = await Province.findAll({
        order: [['name', 'ASC']]
      });
      res.status(200).json({ success: true, data: provinces });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const province = await Province.findByPk(id);
      if (!province) {
        return res.status(404).json({ success: false, message: 'Province not found' });
      }
      res.status(200).json({ success: true, data: province });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const province = await Province.create(req.body);
      res.status(201).json({ success: true, message: 'Province created successfully', data: province });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const province = await Province.findByPk(id);
      if (!province) {
        return res.status(404).json({ success: false, message: 'Province not found' });
      }
      await province.update(req.body);
      res.status(200).json({ success: true, message: 'Province updated successfully', data: province });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const province = await Province.findByPk(id);
      if (!province) {
        return res.status(404).json({ success: false, message: 'Province not found' });
      }
      await province.destroy();
      res.status(200).json({ success: true, message: 'Province deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async bulkImport(req, res) {
    try {
      const { provinces } = req.body;
      if (!Array.isArray(provinces) || provinces.length === 0) {
        return res.status(400).json({ success: false, message: 'provinces must be a non-empty array' });
      }

      // Validate each row has at least a name
      const valid = provinces.every(p => p.name && p.name.trim() !== '');
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Each province must have a name' });
      }

      const created = await Province.bulkCreate(
        provinces.map(p => ({ name: p.name.trim(), name_en: (p.name_en || '').trim() })),
        { ignoreDuplicates: true }
      );

      res.status(201).json({
        success: true,
        message: `${created.length} province(s) imported successfully`,
        data: created
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = provinceController;
