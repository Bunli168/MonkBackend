const { RetreatEvent, sequelize } = require('../models');

const retreatEventController = {
  // Get the current active season, whether open or closed
  async getCurrent(req, res) {
    try {
      const activeEvent = await RetreatEvent.findOne({
        where: { is_active: true }
      });
      if (!activeEvent) {
        return res.status(200).json({ success: true, data: null, is_open: false });
      }
      res.status(200).json({ 
        success: true, 
        data: activeEvent,
        is_open: !activeEvent.is_closed 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Start a new season
  async startSeason(req, res) {
    try {
      const { name, start_date, end_date } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Season name is required' });
      }

      const transaction = await sequelize.transaction();
      try {
        // Deactivate all existing events
        await RetreatEvent.update(
          { is_active: false }, 
          { where: {}, transaction }
        );
        
        // Create the new event and set it to active and open
        const newSeason = await RetreatEvent.create({ 
          name, 
          start_date: start_date || null,
          end_date: end_date || null,
          is_active: true,
          is_closed: false
        }, { transaction });
        
        // Clear all seating assignments so users can register fresh for the new event
        const { UserProfile } = require('../models');
        await UserProfile.update(
          { seating_row_id: null, seat_number: null },
          { where: {}, transaction }
        );
        
        await transaction.commit();
        res.status(201).json({ success: true, message: 'New season started', data: newSeason });
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'Season name already exists' });
      }
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Close the current active season
  async closeSeason(req, res) {
    try {
      const activeEvent = await RetreatEvent.findOne({ where: { is_active: true } });
      
      if (!activeEvent) {
        return res.status(404).json({ success: false, message: 'No active season found to close' });
      }

      if (activeEvent.is_closed) {
        return res.status(400).json({ success: false, message: 'Season is already closed' });
      }

      await activeEvent.update({ is_closed: true });
      res.status(200).json({ success: true, message: 'Season closed', data: activeEvent });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Legacy/Helper to get all events for history
  async getAll(req, res) {
    try {
      const events = await RetreatEvent.findAll({
        order: [['created_at', 'DESC']]
      });
      res.status(200).json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = retreatEventController;
