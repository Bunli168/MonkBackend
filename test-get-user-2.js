const { User, Role, UserProfile, Kut, Address, Document, MonkSurvey } = require('./models');

async function test() {
  try {
    const user = await User.findByPk(1, {
      include: [{ model: UserProfile }, { model: MonkSurvey }]
    });
    console.log(JSON.stringify(user, null, 2));
    
    // Fetch user 2, 3, etc.
    const users = await User.findAll({ limit: 5, include: [UserProfile, MonkSurvey] });
    users.forEach(u => console.log(`User ${u.id}: email=${u.email}, profile=${!!u.UserProfile}, survey=${!!u.MonkSurvey}`));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
