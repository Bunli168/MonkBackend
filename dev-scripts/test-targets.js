require('dotenv').config();
const { SurveyTarget } = require('./models');

async function run() {
  try {
    const targets = await SurveyTarget.findAll({ raw: true });
    console.log(targets);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

run();
