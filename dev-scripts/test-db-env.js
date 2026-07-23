require('dotenv').config();
const sequelize = require('./config/database');

async function run() {
  try {
    const [results] = await sequelize.query("SELECT * FROM surveys");
    console.log("Surveys in DB:", results.length);
    console.log(results);
  } catch(e) {
    console.log("Error:", e.message);
  }
  process.exit();
}

run();
