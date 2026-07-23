const { LeaveRequest, User, UserProfile } = require('./models');

async function test() {
  const list = await LeaveRequest.findAll({
    include: [{ model: User, include: [UserProfile] }]
  });
  console.log(list.map(l => ({
    id: l.id,
    user_id: l.user_id,
    status: l.status,
    User: l.User ? { email: l.User.email, profile: l.User.UserProfile ? l.User.UserProfile.toJSON() : null } : null
  })));
}

test().catch(console.error).finally(() => process.exit());
