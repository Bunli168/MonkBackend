const { SeatingRow, User } = require('../models');

const seatingRowController = {
  async getAll(req, res) {
    try {
      const seatingRows = await SeatingRow.findAll({
        include: [
          {
            model: User,
            as: 'AssignedTaker',
            attributes: ['id', 'email', 'phone'],
            include: [{ model: require('../models').UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
          }
        ],
        order: [['row_num', 'ASC']]
      });
      
      res.status(200).json({ success: true, data: seatingRows });
    } catch (error) {
      console.error('Get seating rows error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const seatingRow = await SeatingRow.findByPk(id, {
        include: [
          {
            model: User,
            as: 'AssignedTaker',
            attributes: ['id', 'email', 'phone'],
            include: [{ model: require('../models').UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
          }
        ]
      });
      
      if (!seatingRow) {
        return res.status(404).json({ success: false, message: 'Seating row not found' });
      }
      
      res.status(200).json({ success: true, data: seatingRow });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getTakenSeats(req, res) {
    try {
      const { id } = req.params;
      const { UserProfile } = require('../models');
      const profiles = await UserProfile.findAll({
        where: { seating_row_id: id },
        attributes: ['seat_number']
      });
      const takenSeats = profiles.map(p => parseInt(p.seat_number, 10)).filter(n => !isNaN(n));
      res.status(200).json({ success: true, takenSeats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async create(req, res) {
    try {
      const seatingRow = await SeatingRow.create(req.body);
      res.status(201).json({ success: true, message: 'Seating row created successfully', data: seatingRow });
    } catch (error) {
      console.error('Create seating row error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const seatingRow = await SeatingRow.findByPk(id);
      
      if (!seatingRow) {
        return res.status(404).json({ success: false, message: 'Seating row not found' });
      }
      
      await seatingRow.update(req.body);
      res.status(200).json({ success: true, message: 'Seating row updated successfully', data: seatingRow });
    } catch (error) {
      console.error('Update seating row error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const seatingRow = await SeatingRow.findByPk(id);
      
      if (!seatingRow) {
        return res.status(404).json({ success: false, message: 'Seating row not found' });
      }
      
      await seatingRow.destroy();
      res.status(200).json({ success: true, message: 'Seating row deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async bulkSetCapacity(req, res) {
    try {
      const { capacity } = req.body;
      if (capacity === undefined || capacity < 0) {
        return res.status(400).json({ success: false, message: 'Valid capacity is required' });
      }

      await SeatingRow.update({ capacity }, { where: {} });
      res.status(200).json({ success: true, message: 'All rows updated successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async initializeRows(req, res) {
    try {
      // Check if rows already exist
      const existing = await SeatingRow.findOne();
      if (existing) {
        return res.status(400).json({ success: false, message: 'Seating rows already exist' });
      }
      
      // Create 17 rows
      const rows = [];
      for (let i = 1; i <= 17; i++) {
        const row = await SeatingRow.create({
          row_num: i,
          capacity: 0
        });
        rows.push(row);
      }
      
      res.status(201).json({ success: true, message: '17 seating rows initialized successfully', data: rows });
    } catch (error) {
      console.error('Initialize rows error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async assignTaker(req, res) {
    try {
      const { row_id, taker_id } = req.body;
      
      const seatingRow = await SeatingRow.findByPk(row_id);
      if (!seatingRow) {
        return res.status(404).json({ success: false, message: 'Seating row not found' });
      }
      
      await seatingRow.update({ assigned_taker_id: taker_id });
      res.status(200).json({ success: true, message: 'Attendance taker assigned successfully', data: seatingRow });
    } catch (error) {
      console.error('Assign taker error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteAll(req, res) {
    try {
      await SeatingRow.destroy({ where: {} });
      res.status(200).json({ success: true, message: 'All seating rows deleted successfully' });
    } catch (error) {
      console.error('Delete all seating rows error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
};

module.exports = seatingRowController;
