const { User, UserProfile, Role, SeatingRow } = require('./models');

async function seed() {
  const users = await User.findAll({ include: [Role, UserProfile] });
  const rows = await SeatingRow.findAll();
  
  if (users.length === 0) {
    console.log("No users found.");
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log("No rows found. Please initialize rows first.");
    process.exit(1);
  }
  
  const user = users[0];
  const row = rows[0];
  
  console.log(`Assigning user ${user.email} to Row ${row.row_num}, Seat 1`);
  
  if (user.UserProfile) {
    await user.UserProfile.update({ seating_row_id: row.id, seat_number: 1 });
  } else {
    await UserProfile.create({ user_id: user.id, seating_row_id: row.id, seat_number: 1 });
  }
  console.log("Done.");
}

seed();
