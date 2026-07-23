const { Report } = require('./models');

async function test() {
  try {
    const reports = await Report.findAll({ raw: true });
    console.log('ALL REPORTS:', reports);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
