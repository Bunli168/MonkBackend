const { Survey, SurveyTarget, User } = require('./models');

async function run() {
  try {
    const surveys = await Survey.findAndCountAll({
      include: [
        { model: SurveyTarget, as: 'target' },
        { model: User, as: 'targetTeacher', attributes: ['id', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'email'] }
      ]
    });
    console.log("Success! Count:", surveys.count);
  } catch(e) {
    console.log("Error:", e.message);
  }
  process.exit();
}

run();
