const { User, Attendance, Role } = require('./models');
const attendanceController = require('./controllers/attendanceController');

async function test() {
  const user = await User.findOne({ include: [Role] });
  if (!user) return console.log("No user");

  const req = {
    query: {},
    user: user
  };

  const res = {
    status: (s) => ({
      json: (data) => console.log(`Status: ${s}, Data count:`, data.data ? data.data.length : 'none', data.message)
    })
  };

  console.log("Testing with user:", req.user.id, req.user.email, "Role:", req.user.Role ? req.user.Role.name : 'none');
  await attendanceController.getAll(req, res);
}

test().catch(console.error).then(() => process.exit(0));
