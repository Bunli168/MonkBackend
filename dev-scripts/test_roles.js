const { sequelize, Role } = require('./models');
(async () => {
  try {
    await sequelize.authenticate();
    const roles = await Role.findAll();
    console.log("Roles:", roles.map(r => r.name));
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit();
  }
})();
