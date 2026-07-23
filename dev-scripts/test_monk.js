const { sequelize, User, Role } = require('./models');
const { generateAccessToken } = require('./utils/jwt');

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ include: [{ model: Role, where: { name: 'Student' } }] });
    if (!user) {
      console.log("No student found");
      process.exit();
    }
    console.log("Found user:", user.id, user.Role.name);
    const token = generateAccessToken({ userId: user.id });
    console.log(token);
    process.exit();
  } catch (e) {
    console.error("Error:", e.message);
    process.exit();
  }
})();
