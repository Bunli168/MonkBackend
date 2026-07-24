const { MonkSurvey, User, UserProfile } = require('./models');

async function test() {
  try {
    const surveys = await MonkSurvey.findAll({
      include: [{
        model: User,
        attributes: ['id', 'email', 'role_id'],
        include: [{ model: UserProfile, attributes: ['avatar_url', 'first_name_kh', 'last_name_kh', 'date_of_birth', 'phone_number', 'chhaya_number', 'from_wat'] }]
      }]
    });
    console.log('Success, rows:', surveys.length);
  } catch (error) {
    console.error('Sequelize Error:', error);
  }
}
test();
