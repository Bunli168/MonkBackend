const { User, LeaveRequest, Role } = require('./models');
const leaveRequestController = require('./controllers/leaveRequestController');

async function test() {
  const users = await User.findAll({ include: [Role] });
  const user = users.find(u => u.Role && !['SuperAdmin', 'Admin', 'AttendanceTaker', 'Mekudi'].includes(u.Role.name));
  
  if (!user) {
    console.log("No normal user found");
    return;
  }

  const req = {
    query: {},
    user: user
  };

  const res = {
    status: (s) => ({
      json: (data) => console.log(`Data count:`, Array.isArray(data) ? data.length : 'none', "for user_id:", user.id, "returned users:", Array.from(new Set((Array.isArray(data) ? data : []).map(d => d.user_id))))
    }),
    json: (data) => console.log(`Data count:`, Array.isArray(data) ? data.length : 'none', "for user_id:", user.id, "returned users:", Array.from(new Set((Array.isArray(data) ? data : []).map(d => d.user_id))))
  };

  await leaveRequestController.getMyRequests(req, res);
}

test().catch(console.error).then(() => process.exit(0));
