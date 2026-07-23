const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function test() {
  const user = await User.findByPk(4); // assuming monk is id 4
  if (user) {
    const hashedPassword = await bcrypt.hash('Neakavorn@123', 10);
    await user.update({ password: hashedPassword, must_change_password: true });
    console.log("Success");
  } else {
    console.log("Not found");
  }
}
test();
