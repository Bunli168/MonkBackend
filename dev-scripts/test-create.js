const { Survey } = require('./models');

async function run() {
  try {
    const survey = await Survey.create({
      title: 'Test Survey',
      description: 'Test Desc',
      created_by: 1
    });
    console.log("Success! ID:", survey.id);
  } catch(e) {
    console.log("Error:", e);
  }
  process.exit();
}

run();
