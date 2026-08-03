const { Attendance, User, UserProfile, LeaveRequest, RetreatEvent } = require('./models');
const { Op } = require('sequelize');

async function run() {
  try {
      const user_id = 97;
      const date = null;
      const status = null;
      const kut_id = null;
      
      const where = { user_id };
      
      let activeYearId = null;
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
      activeYearId = activeYear ? activeYear.id : null;
      
      if (activeYearId) {
        where.retreat_event_id = activeYearId;
      }
      
      const attendances = await Attendance.findAll({
        where,
        order: [['date', 'DESC'], ['createdAt', 'DESC']]
      });

      const leaveWhere = { status: 'approved', user_id, retreat_event_id: activeYearId };
      const approvedLeaves = await LeaveRequest.findAll({
        where: leaveWhere,
        include: [{
          model: User,
          attributes: ['id', 'email', 'phone'],
          include: [{
            model: UserProfile,
            attributes: ['first_name_kh', 'last_name_kh', 'first_name_en', 'last_name_en', 'kut_id', 'seat_number', 'seating_row_id']
          }]
        }]
      });

      const existingDatesMap = new Map();
      attendances.forEach(att => {
        const key = `${att.user_id}_${att.date}`;
        existingDatesMap.set(key, att);
      });

      const mergedAttendances = [...attendances];

      for (const leave of approvedLeaves) {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          if (date && date !== dateStr) continue;

          const key = `${leave.user_id}_${dateStr}`;
          if (existingDatesMap.has(key)) {
            const existingAtt = existingDatesMap.get(key);
            if (existingAtt.status !== 'permission') {
              existingAtt.status = 'permission';
              if (existingAtt.dataValues) existingAtt.dataValues.status = 'permission';
              const leaveNote = `Approved Leave: ${leave.reason}`;
              existingAtt.notes = existingAtt.notes ? `${existingAtt.notes} (${leaveNote})` : leaveNote;
              if (existingAtt.dataValues) existingAtt.dataValues.notes = existingAtt.notes;
            }
            existingAtt.image_url = leave.image_url;
            if (existingAtt.dataValues) existingAtt.dataValues.image_url = leave.image_url;
          } else {
            if (status && status !== 'permission') continue;

            const profile = leave.User?.UserProfile;
            const virt = {
              id: `leave_${leave.id}_${dateStr}`,
              user_id: leave.user_id,
              date: dateStr,
              status: 'permission',
              notes: `Approved Leave: ${leave.reason}`,
              retreat_event_id: leave.retreat_event_id || where.retreat_event_id || 1,
              kut_id: profile ? profile.kut_id : null,
              seating_row_id: profile ? profile.seating_row_id : null,
              seat_number: profile ? profile.seat_number : null,
              createdAt: leave.updatedAt || leave.createdAt,
              image_url: leave.image_url,
              User: leave.User
            };
            if (kut_id && String(virt.kut_id) !== String(kut_id)) continue;
            mergedAttendances.push(virt);
            existingDatesMap.set(key, virt);
          }
        }
      }

      console.log("Merged attendances count:", mergedAttendances.length);
      console.log(JSON.stringify(mergedAttendances, null, 2));
      
  } catch (e) { console.error(e); }
}

run();
