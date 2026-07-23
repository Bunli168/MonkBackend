const { sequelize, User, Role } = require('./models');
const { generateAccessToken } = require('./utils/jwt');

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ include: [Role] });
    const token = generateAccessToken({ userId: user.id });
    console.log(token);
    process.exit();
  } catch (e) {
    console.error("Error:", e.message);
    process.exit();
  }
})();
