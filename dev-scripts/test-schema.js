const sequelize = require('./config/database');

async function run() {
  try {
    const [results] = await sequelize.query("DESCRIBE surveys;");
    console.log(results);
  } catch(e) {
    console.log("Error:", e.message);
  }
  process.exit();
}

run();
