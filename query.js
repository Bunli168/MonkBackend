const { Province, District } = require('./models');

async function run() {
  const pp = await Province.findOne({ where: { name: 'Phnom Penh' } });
  if (!pp) {
     const pps = await Province.findAll();
     console.log('Available provinces:', pps.map(p => p.name));
     return;
  }
  const districts = await District.findAll({ where: { province_id: pp.id } });
  console.log('Phnom Penh districts:', districts.map(d => d.name));
  process.exit(0);
}
run();
