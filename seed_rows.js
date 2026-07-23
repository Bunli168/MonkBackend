const { User, UserProfile, Role, SeatingRow } = require('./models');
const { Op } = require('sequelize');

async function seed() {
  const users = await User.findAll({ 
    include: [
        { model: Role, where: { name: { [Op.in]: ['Monk', 'Bhikkhu'] } } }, 
        UserProfile
    ] 
  });
  const rows = await SeatingRow.findAll();
  
  if (users.length === 0) {
    console.log("No monks/bhikkhus found.");
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log("No rows found.");
    process.exit(1);
  }
  
  const row1 = rows.find(r => r.row_num === 1) || rows[0];
  const row2 = rows.find(r => r.row_num === 2) || rows[1];

  let seatCounterRow1 = 1;
  let seatCounterRow2 = 1;

  for (let i = 0; i < Math.min(20, users.length); i++) {
    const user = users[i];
    const isRow1 = i < 10;
    const targetRow = isRow1 ? row1 : row2;
    const seatNum = isRow1 ? seatCounterRow1++ : seatCounterRow2++;

    console.log(`Assigning ${user.email} (${user.Role.name}) to Row ${targetRow.row_num}, Seat ${seatNum}`);
    
    if (user.UserProfile) {
      await user.UserProfile.update({ seating_row_id: targetRow.id, seat_number: seatNum });
    } else {
      await UserProfile.create({ user_id: user.id, seating_row_id: targetRow.id, seat_number: seatNum });
    }
  }
  
  console.log("Assigned users successfully.");
}

seed();
