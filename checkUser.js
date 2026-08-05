require('dotenv').config();
const { User, Role } = require('./models');

async function checkUser() {
  const user = await User.findOne({
    where: { email: 'bunlykhmer42+2@gmail.com' },
    include: [{ model: Role }]
  });
  console.log('User Role Name:', user.Role ? user.Role.name : 'No Role');
  process.exit();
}
checkUser();
