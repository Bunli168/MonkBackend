const fs = require('fs');
const file = '/Volumes/MyFolder/Pagoda Managemant/Monkbackend/controllers/attendanceController.js';
let content = fs.readFileSync(file, 'utf8');

const rejectCodeOld = `      if (activeYear && activeYear.is_closed) {
        return res.status(400).json({ success: false, message: 'The current season is closed. You cannot record or update attendance.' });
      }`;

const rejectCodeNew = `      if (activeYear) {
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

content = content.replace(new RegExp(rejectCodeOld.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g'), rejectCodeNew);

fs.writeFileSync(file, content);
console.log('Patched attendanceController.js with date check');
