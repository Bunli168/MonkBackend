const { Role, User, UserProfile } = require('./models');

async function test() {
  const roles = await Role.findAll({ attributes: ['id', 'name'] });
  console.log('All roles:', roles.map(r => r.toJSON()));
  
  // Check the admin user's role
  const admins = await User.findAll({
    include: [
      { model: Role, attributes: ['id', 'name'] },
    ],
    limit: 5
  });
  console.log('Sample users:', admins.map(u => ({ id: u.id, email: u.email, role: u.Role?.name })));
}

test().catch(console.error).finally(() => process.exit());
