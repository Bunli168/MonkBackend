const fs = require('fs');
const file = '/Volumes/MyFolder/Pagoda Managemant/Monkbackend/controllers/attendanceController.js';
let content = fs.readFileSync(file, 'utf8');

const badRejectCode = `      if (activeYear) {
        if (activeYear.is_closed) {
          return res.status(400).json({ success: false, message: 'The current season is closed. You cannot record or update attendance.' });
        }
        if (activeYear.end_date) {
          const endDate = new Date(activeYear.end_date);
          const today = new Date();
          endDate.setHours(23, 59, 59, 999);
          if (today > endDate) {
            return res.status(400).json({ success: false, message: 'The current season has ended based on its end date. You cannot record or update attendance.' });
          }
        }
      }`;

// We only want this in `takeAttendance` and `bulkSubmit`. 
// Not in `getAdminSummary` and `getMySummary`
// Let's manually restore the summary ones.

content = content.replace(
`  async getAdminSummary(req, res) {
    try {
      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
${badRejectCode}`,
`  async getAdminSummary(req, res) {
    try {
      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });`
);

content = content.replace(
`  async getMySummary(req, res) {
    try {
      const userId = req.user.id;

      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
${badRejectCode}`,
`  async getMySummary(req, res) {
    try {
      const userId = req.user.id;

      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });`
);

fs.writeFileSync(file, content);
console.log('Fixed attendanceController.js summaries!');
