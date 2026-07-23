const { sequelize } = require('./models');
(async () => {
  try {
    await sequelize.query('ALTER TABLE reports MODIFY COLUMN kut_id INTEGER NULL;');
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
})();
