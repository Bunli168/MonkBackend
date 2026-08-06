const { CeremonyEvent, EventKutTarget, EventParticipant, User, UserProfile, Kut, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getIo, emitToUser, emitToAdmins, emitToSuperAdmins } = require('../config/socket');

const ceremonyEventController = {
  // 1. Get all events (Admin)
  async getAllEvents(req, res) {
    try {
      let whereClause = {};
      const roleName = req.user.Role ? req.user.Role.name.replace(/\s+/g, '').toUpperCase() : '';
      console.log('getAllEvents called. User Role:', roleName, 'User ID:', req.user.id);
      
      if (roleName !== 'SUPERADMIN') {
        whereClause.created_by = req.user.id;
        console.log('Applying whereClause:', whereClause);
      } else {
        console.log('User is SUPERADMIN. Fetching only SuperAdmin events.');
        // Fetch all SuperAdmin IDs
        const superAdmins = await User.findAll({
          include: [{
            model: require('../models').Role,
            where: { name: { [Op.in]: ['SuperAdmin', 'SUPERADMIN', 'SUPER_ADMIN', 'Super Admin'] } }
          }],
          attributes: ['id']
        });
        const superAdminIds = superAdmins.map(u => u.id);
        whereClause.created_by = { [Op.in]: superAdminIds };
      }
      const { month, year } = req.query;
      
      if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month
        whereClause.event_date = {
          [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
        };
      }

      const events = await CeremonyEvent.findAll({
        where: whereClause,
        include: [
          {
            model: EventKutTarget,
            as: 'KutTargets',
            include: [{ model: Kut, attributes: ['id', 'name'] }]
          },
          {
            model: EventParticipant,
            as: 'Participants',
            include: [
              {
                model: User,
                as: 'User',
                attributes: ['id'],
                include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh', 'avatar_url', 'kut_id'] }]
              }
            ]
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['id'],
            include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
          }
        ],
        order: [['event_date', 'DESC'], ['event_time', 'DESC']]
      });
      res.json({ success: true, data: events });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Create an event (Super Admin / Chao Athikar)
  async createEvent(req, res) {
    const t = await sequelize.transaction();
    try {
      const { title, description, event_date, event_time, target_kuts } = req.body;
      const user_id = req.user.id;

      const event = await CeremonyEvent.create({
        title,
        description,
        event_date,
        event_time,
        created_by: user_id
      }, { transaction: t });

      // If specific Kuts are targeted (Workflow A: Pchum Ben / Workflow B: Bindabat)
      if (target_kuts && Array.isArray(target_kuts) && target_kuts.length > 0) {
        const kutTargets = target_kuts.map(target => ({
          event_id: event.id,
          kut_id: target.kut_id,
          requested_monks_count: target.count || 1,
          status: 'PENDING_MEKUDI'
        }));
        await EventKutTarget.bulkCreate(kutTargets, { transaction: t });
        
        // TODO: Trigger Telegram notifications to Mekudis of these Kuts
      }

      await t.commit();
      try {
        const io = getIo();
        io.to('admin').to('superadmin').emit('ceremony_event_created', event);
      } catch (err) {
        console.error('Socket emit error:', err);
      }
      res.status(201).json({ success: true, message: 'Ceremony event created successfully', data: event });
    } catch (error) {
      await t.rollback();
      console.error('Error creating event:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Get pending assignments for a Mekudi (Workflow A/B)
  // 3.5 Get Monk Stats for a given Kudi
  async getMonkStats(req, res) {
    try {
      const user = req.user;
      const { month, year } = req.query;

      const userProfile = user.UserProfile || await UserProfile.findOne({ where: { user_id: user.id } });
      if (!userProfile || !userProfile.kut_id) {
        return res.status(400).json({ success: false, message: 'You are not assigned to a Kut.' });
      }

      // We need to fetch all monks/bhikkhus in this Kudi
      const users = await User.findAll({
        where: { role_id: { [Op.in]: [3, 7] }, is_active: true },
        include: [
          {
            model: UserProfile,
            where: { kut_id: userProfile.kut_id },
            attributes: ['first_name_kh', 'last_name_kh', 'first_name_en', 'last_name_en']
          },
          {
            model: require('../models').Role,
            attributes: ['name']
          },
          {
            model: EventParticipant,
            as: 'EventParticipations',
            include: [
              {
                model: CeremonyEvent,
                as: 'CeremonyEvent',
                attributes: ['event_date']
              }
            ]
          }
        ]
      });

      // Process and filter by month/year if provided
      let stats = users.map(u => {
        let events = u.EventParticipations || [];
        
        if (month && year) {
          events = events.filter(p => {
            if (!p.CeremonyEvent || !p.CeremonyEvent.event_date) return false;
            const eventDate = new Date(p.CeremonyEvent.event_date);
            return eventDate.getMonth() + 1 === parseInt(month) && eventDate.getFullYear() === parseInt(year);
          });
        }

        const uObj = u.toJSON();
        let firstName = uObj.UserProfile?.first_name_kh || uObj.UserProfile?.first_name_en || '';
        let lastName = uObj.UserProfile?.last_name_kh || uObj.UserProfile?.last_name_en || '';

        return {
          id: u.id,
          firstName,
          lastName,
          role: uObj.Role ? uObj.Role.name : '',
          roleId: u.role_id,
          eventCount: events.length
        };
      });

      // Sort: Bhikkhu (7) first, then Monk (3)
      stats.sort((a, b) => {
        const roleA = a.roleId === 7 ? 1 : 2;
        const roleB = b.roleId === 7 ? 1 : 2;
        return roleA - roleB;
      });

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching monk stats:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getMyAssignments(req, res) {
    try {
      const user_id = req.user.id;
      const participations = await EventParticipant.findAll({
        where: { user_id },
        include: [
          {
            model: CeremonyEvent,
            as: 'CeremonyEvent',
            include: [
              {
                model: User,
                as: 'Creator',
                attributes: ['id'],
                include: [{ model: UserProfile, attributes: ['first_name_kh', 'last_name_kh'] }]
              }
            ]
          }
        ],
        order: [[{ model: CeremonyEvent, as: 'CeremonyEvent' }, 'event_date', 'DESC'], [{ model: CeremonyEvent, as: 'CeremonyEvent' }, 'event_time', 'DESC']]
      });
      res.json({ success: true, data: participations });
    } catch (error) {
      console.error('Error fetching my assignments:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateMyAssignmentStatus(req, res) {
    try {
      const { eventId } = req.params;
      const { status } = req.body;
      const user_id = req.user.id;

      if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const participant = await EventParticipant.findOne({
        where: { event_id: eventId, user_id }
      });

      if (!participant) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }

      await participant.update({ status });

      try {
        const io = getIo();
        io.to('admin').to('superadmin').to(`user_${user_id}`).emit('ceremony_assignment_updated', { event_id: eventId, user_id });
      } catch (err) {
        console.error('Socket emit error:', err);
      }

      res.json({ success: true, message: 'Status updated successfully', data: participant });
    } catch (error) {
      console.error('Error updating assignment status:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getPendingAssignments(req, res) {
    try {
      const user = req.user;
      const roleName = user.Role ? user.Role.name.toUpperCase() : '';
      
      let whereClause = {};
      
      const userProfile = user.UserProfile || await UserProfile.findOne({ where: { user_id: user.id } });
      
      if (!userProfile || !userProfile.kut_id) {
        return res.status(400).json({ success: false, message: 'You are not assigned to a Kut. As an Admin, you can still view Ceremony Events in the other tab, but you cannot fulfill Kudi assignments unless you belong to a Kut.' });
      }
      
      whereClause.kut_id = userProfile.kut_id;
      const { month, year } = req.query;
      let eventWhere = {};
      
      if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month
        eventWhere = {
          event_date: {
            [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
          }
        };
      }

      const pendingTargets = await EventKutTarget.findAll({
        where: whereClause,
        include: [
          { 
            model: CeremonyEvent, as: 'CeremonyEvent',
            where: eventWhere,
            include: [
              {
                model: EventParticipant,
                as: 'Participants',
                required: false,
                include: [
                  {
                    model: User,
                    as: 'User',
                    required: true,
                    include: [
                      {
                        model: UserProfile,
                        where: { kut_id: userProfile.kut_id },
                        attributes: ['first_name_kh', 'last_name_kh']
                      }
                    ]
                  }
                ]
              }
            ]
          },
          { model: Kut, attributes: ['id', 'name'] }
        ]
      });

      res.json({ success: true, data: pendingTargets });
    } catch (error) {
      console.error('Error fetching pending assignments:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getMemberResponses(req, res) {
    try {
      const user = req.user;
      const userProfile = user.UserProfile || await UserProfile.findOne({ where: { user_id: user.id } });
      
      if (!userProfile || !userProfile.kut_id) {
        return res.status(400).json({ success: false, message: 'You are not assigned to a Kut.' });
      }

      const { month, year } = req.query;
      let eventWhere = {};
      
      if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month
        const { Op } = require('sequelize');
        eventWhere = {
          event_date: {
            [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
          }
        };
      }

      const responses = await EventParticipant.findAll({
        include: [
          {
            model: User,
            as: 'User',
            required: true,
            include: [
              {
                model: UserProfile,
                where: { kut_id: userProfile.kut_id },
                attributes: ['first_name_kh', 'last_name_kh', 'avatar_url']
              }
            ]
          },
          {
            model: CeremonyEvent,
            as: 'CeremonyEvent',
            required: true,
            where: eventWhere,
            attributes: ['id', 'title', 'event_date', 'event_time']
          }
        ],
        order: [[{ model: CeremonyEvent, as: 'CeremonyEvent' }, 'event_date', 'DESC']]
      });

      res.json({ success: true, data: responses });
    } catch (error) {
      console.error('Error fetching member responses:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 4. Mekudi assigns monks to fulfill the Kut Target
  async assignMonks(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params; // EventKutTarget ID
      const { user_ids } = req.body; // Array of user IDs assigned
      const assigner_id = req.user.id;

      const target = await EventKutTarget.findByPk(id, { include: [{ model: CeremonyEvent, as: 'CeremonyEvent' }] });
      if (!target) {
        return res.status(404).json({ success: false, message: 'Target request not found' });
      }
      if (target.status === 'REJECTED') {
        return res.status(400).json({ success: false, message: 'This request was rejected.' });
      }

      // Verify the count matches
      if (!user_ids || user_ids.length !== target.requested_monks_count) {
        return res.status(400).json({ 
          success: false, 
          message: `You must assign exactly ${target.requested_monks_count} monk(s).` 
        });
      }

      // Find all users in this Kudi to clear their previous assignments for this event
      const kudiUsers = await UserProfile.findAll({ where: { kut_id: target.kut_id }, attributes: ['user_id'] });
      const kudiUserIds = kudiUsers.map(u => u.user_id);

      // Remove existing participants from this Kudi for this event
      if (kudiUserIds.length > 0) {
        await EventParticipant.destroy({
          where: {
            event_id: target.event_id,
            user_id: { [Op.in]: kudiUserIds }
          },
          transaction: t
        });
      }

      // Create Participants
      const participants = user_ids.map(uid => ({
        event_id: target.event_id,
        user_id: uid,
        assigned_by: assigner_id,
        status: 'ASSIGNED'
      }));

      await EventParticipant.bulkCreate(participants, { transaction: t });

      // Update target status to FULFILLED
      await target.update({ status: 'FULFILLED' }, { transaction: t });

      // TODO: Send Telegram notification to the assigned monks

      try {
        const io = getIo();
        io.to('admin').to('superadmin').emit('ceremony_assignment_updated', { target_id: id });
        user_ids.forEach(uid => {
          io.to(`user_${uid}`).emit('ceremony_assignment_updated', { target_id: id });
        });
      } catch (err) {
        console.error('Socket emit error:', err);
      }

      await t.commit();
      res.json({ success: true, message: 'Monks assigned successfully' });
    } catch (error) {
      await t.rollback();
      console.error('Error assigning monks:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Reject an assignment request
  async rejectAssignment(req, res) {
    try {
      const { id } = req.params;
      const target = await EventKutTarget.findByPk(id);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Target request not found' });
      }

      await target.update({ status: 'REJECTED' });

      try {
        const io = getIo();
        io.to('admin').to('superadmin').emit('ceremony_assignment_updated', { target_id: id });
      } catch (err) {
        console.error('Socket emit error:', err);
      }

      res.json({ success: true, message: 'Assignment request rejected successfully' });
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 5. Direct assignment by Mekudi for internal Kudi events (Workflow C)
  async createInternalEvent(req, res) {
    const t = await sequelize.transaction();
    try {
      const { title, description, event_date, event_time, user_ids } = req.body;
      const user_id = req.user.id;

      const event = await CeremonyEvent.create({
        title,
        description,
        event_date,
        event_time,
        created_by: user_id
      }, { transaction: t });

      if (user_ids && user_ids.length > 0) {
        const participants = user_ids.map(uid => ({
          event_id: event.id,
          user_id: uid,
          assigned_by: user_id,
          status: 'ASSIGNED'
        }));
        await EventParticipant.bulkCreate(participants, { transaction: t });
      }

      await t.commit();
      try {
        const io = getIo();
        io.to('admin').to('superadmin').emit('ceremony_event_created', event);
        if (user_ids && user_ids.length > 0) {
          user_ids.forEach(uid => {
            io.to(`user_${uid}`).emit('ceremony_assignment_updated', { event_id: event.id });
          });
        }
      } catch (err) {
        console.error('Socket emit error:', err);
      }
      res.status(201).json({ success: true, message: 'Internal event created successfully', data: event });
    } catch (error) {
      await t.rollback();
      console.error('Error creating internal event:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 6. Update an event (Super Admin / Admin)
  async updateEvent(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { title, description, event_date, event_time, target_kuts, user_ids } = req.body;

      const event = await CeremonyEvent.findByPk(id);
      if (!event) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const roleName = req.user.Role ? req.user.Role.name.replace(/\s+/g, '').toUpperCase() : '';
      if (roleName !== 'SUPERADMIN' && event.created_by !== req.user.id) {
        await t.rollback();
        return res.status(403).json({ success: false, message: 'You do not have permission to modify this event.' });
      }

      await event.update({
        title,
        description,
        event_date,
        event_time
      }, { transaction: t });

      if (target_kuts && Array.isArray(target_kuts)) {
        const newKutIds = target_kuts.map(target => target.kut_id);
        const existingTargets = await EventKutTarget.findAll({ where: { event_id: id }, transaction: t });
        
        // Delete targets that are no longer selected
        const targetsToDelete = existingTargets.filter(t => !newKutIds.includes(t.kut_id));
        for (const target of targetsToDelete) {
          await target.destroy({ transaction: t });
        }
        
        // Update or create targets
        for (const target of target_kuts) {
          const existing = existingTargets.find(t => t.kut_id === target.kut_id);
          if (existing) {
            await existing.update({ requested_monks_count: target.count || 1 }, { transaction: t });
          } else {
            await EventKutTarget.create({
              event_id: id,
              kut_id: target.kut_id,
              requested_monks_count: target.count || 1,
              status: 'PENDING_MEKUDI'
            }, { transaction: t });
          }
        }
      }

      if (user_ids && Array.isArray(user_ids)) {
        const existingParticipants = await EventParticipant.findAll({ where: { event_id: id }, transaction: t });
        const existingUserIds = existingParticipants.map(p => p.user_id);

        const participantsToAdd = user_ids.filter(uid => !existingUserIds.includes(uid));
        const participantsToRemove = existingUserIds.filter(uid => !user_ids.includes(uid));

        if (participantsToRemove.length > 0) {
          await EventParticipant.destroy({
            where: { event_id: id, user_id: participantsToRemove },
            transaction: t
          });
        }

        if (participantsToAdd.length > 0) {
          const newParticipants = participantsToAdd.map(uid => ({
            event_id: id,
            user_id: uid,
            assigned_by: req.user.id,
            status: 'ASSIGNED'
          }));
          await EventParticipant.bulkCreate(newParticipants, { transaction: t });
        }
      }

      await t.commit();
      try {
        const io = getIo();
        io.to('admin').to('superadmin').emit('ceremony_event_updated', event);
        if (user_ids && Array.isArray(user_ids)) {
          user_ids.forEach(uid => {
            io.to(`user_${uid}`).emit('ceremony_assignment_updated', { event_id: id });
          });
        }
      } catch (err) {
        console.error('Socket emit error:', err);
      }
      res.json({ success: true, message: 'Event updated successfully', data: event });
    } catch (error) {
      await t.rollback();
      console.error('Error updating event:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 7. Delete an event (Super Admin / Admin)
  async deleteEvent(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const event = await CeremonyEvent.findByPk(id);
      
      if (!event) {
        await t.rollback();
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const roleName = req.user.Role ? req.user.Role.name.replace(/\s+/g, '').toUpperCase() : '';
      if (roleName !== 'SUPERADMIN' && event.created_by !== req.user.id) {
        await t.rollback();
        return res.status(403).json({ success: false, message: 'You do not have permission to delete this event.' });
      }

      // Delete associations first to avoid FK constraints if cascade is not set
      await EventParticipant.destroy({ where: { event_id: id }, transaction: t });
      await EventKutTarget.destroy({ where: { event_id: id }, transaction: t });
      
      await event.destroy({ transaction: t });
      
      await t.commit();
      try {
        const io = getIo();
        io.to('admin').to('superadmin').emit('ceremony_event_deleted', { event_id: id });
      } catch (err) {
        console.error('Socket emit error:', err);
      }
      res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
      await t.rollback();
      console.error('Error deleting event:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = ceremonyEventController;
