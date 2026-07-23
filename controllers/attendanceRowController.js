const { Attendance, User, AttendanceRow, Kut } = require('../models');
const { Op } = require('sequelize');

const attendanceRowController = {
  // Create a new attendance row (assign taker)
  async create(req, res) {
    try {
      const { kut_id, date, taker_id } = req.body;
      if (!kut_id || !date || !taker_id) {
        return res.status(400).json({ success: false, message: 'kut_id, date, and taker_id are required' });
      }
      const row = await AttendanceRow.create({ kut_id, date, taker_id });
      return res.status(201).json({ success: true, data: row });
    } catch (error) {
      console.error('Create attendance row error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // List rows for a Kut and date (optional filters)
  async list(req, res) {
    try {
      const { kut_id, date } = req.query;
      const where = {};
      if (kut_id) where.kut_id = kut_id;
      if (date) where.date = date;
      const rows = await AttendanceRow.findAll({
        where,
        include: [{ model: User, as: 'taker', attributes: ['id', 'name'] }]
      });
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error('List attendance rows error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get monks & attendance for a specific row
  async getMonksByRow(req, res) {
    try {
      const { id } = req.params; // row id
      const row = await AttendanceRow.findByPk(id);
      if (!row) return res.status(404).json({ success: false, message: 'Row not found' });

      // Get monks (users) linked to the Kut (same as before)
      const monks = await User.findAll({
        where: { kut_id: row.kut_id },
        attributes: ['id', 'email', 'phone']
      });

      // Get existing attendances for this row
      const attendances = await Attendance.findAll({
        where: { row_id: id },
        attributes: ['user_id', 'status', 'notes']
      });

      const attMap = {};
      attendances.forEach(a => {
        attMap[a.user_id] = { status: a.status, notes: a.notes };
      });

      const result = monks.map(m => ({
        ...m.toJSON(),
        attendance: attMap[m.id] || null
      }));

      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Get monks by row error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Delete an attendance row and its attendances
  async delete(req, res) {
    try {
      const { id } = req.params;
      const row = await AttendanceRow.findByPk(id);
      if (!row) return res.status(404).json({ success: false, message: 'Row not found' });

      await Attendance.destroy({ where: { row_id: id } });
      await row.destroy();
      return res.status(200).json({ success: true, message: 'Row and attendances deleted' });
    } catch (error) {
      console.error('Delete attendance row error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = attendanceRowController;
