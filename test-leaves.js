const { LeaveRequest, User, UserProfile, RetreatEvent } = require('./models');

async function test() {
  const leaves = await LeaveRequest.findAll({ where: { status: 'approved' } });
  console.log("Approved leaves:", leaves.map(l => l.toJSON()));
}

test();
