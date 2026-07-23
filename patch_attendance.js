const { Attendance, User, Kut, UserProfile, SeatingRow, Role, Payment, FinePayment, LeaveRequest, RetreatEvent } = require('./models');
const { Op } = require('sequelize');

async function test() {
    const date = '2026-07-23';
    const leaveRequests = await LeaveRequest.findAll({
        where: {
          start_date: { [Op.lte]: date },
          end_date: { [Op.gte]: date },
          status: { [Op.notIn]: ['rejected'] }
        },
        attributes: ['user_id', 'status', 'reason']
    });
    console.log(leaveRequests.map(lr => lr.toJSON()));
}
test();
