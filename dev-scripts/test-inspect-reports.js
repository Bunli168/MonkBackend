require('dotenv').config();
const { Report, UserProfile, User, Role } = require('./models');

async function run() {
  try {
    const reports = await Report.findAll({ raw: true });
    console.log("REPORTS IN DB:");
    console.log(reports);

    const profiles = await UserProfile.findAll({ 
      include: [{ model: User, include: [Role] }],
      // raw: true
    });
    console.log("\nUSER PROFILES IN DB:");
    profiles.forEach(p => {
      console.log(`User ID: ${p.user_id}, Name: ${p.User?.firstName} ${p.User?.lastName}, Role: ${p.User?.Role?.name}, Kut ID: ${p.kut_id}`);
    });
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

run();
