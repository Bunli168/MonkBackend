const { User, Role } = require('./models');

async function test() {
  const user = await User.findOne({ include: [Role] });
  console.log("user.role:", user.role);
  console.log("user.Role.name:", user.Role.name);
}

test().catch(console.error).then(() => process.exit(0));
