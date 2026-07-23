const { UserProfile, sequelize } = require('./models');

async function run() {
  await sequelize.query(`UPDATE user_profiles SET seat_number = TRIM(seat_number) WHERE seat_number IS NOT NULL;`);
  console.log("Trimmed seats");
  try {
    await sequelize.query(`ALTER TABLE user_profiles ADD UNIQUE INDEX seating_seat_unique (seating_row_id, seat_number);`);
    console.log("Added index");
  } catch(e) {
    console.error("Index might already exist or error:", e.message);
  }
}
run().then(() => process.exit(0));
