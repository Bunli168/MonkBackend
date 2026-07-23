require('dotenv').config();
const { Kut, UserProfile, User, Role } = require('./models');

async function run() {
  try {
    const kuts = await Kut.findAll({ raw: true });
    console.log("KUTS IN DB:");
    console.log(kuts);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

run();
