const { Report, ReportCategory } = require('./models');

async function run() {
  const cats = await ReportCategory.findAll({ raw: true });
  console.log('CATS:', cats);
}
run();
