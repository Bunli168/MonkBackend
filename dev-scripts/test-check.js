const { UserProfile } = require('./models');
async function test() {
  const profile = await UserProfile.findOne({ where: { user_id: 1 } });
  console.log(profile.toJSON());
}
test();
