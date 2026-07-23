require('dotenv').config();
const { UserProfile, Report } = require('./models');

async function run() {
  try {
    // Update User 4 to be in Kut 3 (since User 11 is Admin of Kut 3)
    await UserProfile.update({ kut_id: 3 }, { where: { user_id: 4 } });
    console.log("Updated User 4 profile to Kut 3");

    // Update Report 1 to Kut 3
    await Report.update({ kut_id: 3 }, { where: { id: 1 } });
    console.log("Updated Report 1 to Kut 3");
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

run();
