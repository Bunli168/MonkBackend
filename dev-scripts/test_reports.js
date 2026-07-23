const { sequelize } = require('./models');
const reportService = require('./services/reportService');
(async () => {
  try {
    await sequelize.authenticate();
    const reports = await reportService.getAllReports('Student', 1);
    console.log("Success:", reports.length);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit();
  }
})();
