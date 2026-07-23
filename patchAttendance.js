const fs = require('fs');
const file = '/Volumes/MyFolder/Pagoda Managemant/Monkbackend/controllers/attendanceController.js';
let content = fs.readFileSync(file, 'utf8');

const rejectCode = `      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
      if (activeYear && activeYear.is_closed) {
        return res.status(400).json({ success: false, message: 'The current season is closed. You cannot record or update attendance.' });
      }
      const activeYearId = activeYear ? activeYear.id : null;`;

// Only replace in create, update, and bulkCreate. 
// We DO NOT want to block "getAll" or other read operations.
// The string we are looking for is:
const targetStr = `      // Fetch active year
      const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
      const activeYearId = activeYear ? activeYear.id : null;`;

content = content.replace(new RegExp(targetStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), rejectCode);

fs.writeFileSync(file, content);
console.log('Patched attendanceController.js');
