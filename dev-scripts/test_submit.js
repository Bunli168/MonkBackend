const { sequelize, User, Role } = require('./models');
const reportService = require('./services/reportService');

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ include: [Role] });
    console.log("Found user:", user.id);
    
    // Create a report
    await reportService.submitReport({
      title: 'Test',
      content: 'Test content',
      reported_by: user.id
    });
    console.log("Report created");
    
    // Fetch all reports
    const reports = await reportService.getAllReports(user.Role.name, user.id);
    console.log("Fetched reports successfully:", reports.length);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit();
  }
})();
