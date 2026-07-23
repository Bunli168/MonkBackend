const { User, UserProfile, MonkSurvey } = require('./models');

async function test() {
  try {
    const user = await User.findByPk(4, {
      include: [{ model: UserProfile }, { model: MonkSurvey }]
    });
    console.log(JSON.stringify(user, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
