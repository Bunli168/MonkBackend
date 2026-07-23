const { User, UserProfile } = require('./models');

async function test() {
  const users = await User.findAll({ include: [UserProfile] });
  users.forEach(u => {
    console.log(`User ${u.id}: hasProfile=${!!u.UserProfile}`);
  });
}
test();
