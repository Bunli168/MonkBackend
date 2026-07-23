const { sequelize, User, Role } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    const users = await User.findAll({ include: [Role] });
    users.forEach(u => {
      console.log(`User ${u.id}: ${u.email}, Role: ${u.Role ? u.Role.name : 'null'}`);
    });
    process.exit();
  } catch (e) {
    console.error("Error:", e.message);
    process.exit();
  }
})();
