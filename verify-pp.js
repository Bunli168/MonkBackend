const { Province, District } = require('./models');

async function run() {
  const pp = await Province.findOne({ where: { name: 'ភ្នំពេញ (រាជធានី)' } });
  if (pp) {
      const districts = await District.findAll({ where: { province_id: pp.id } });
      console.log('ភ្នំពេញ (រាជធានី) districts:', districts.map(d => d.name));
  } else {
      const pps = await Province.findAll();
      console.log('Available provinces:', pps.map(p => p.name));
  }
  process.exit(0);
}
run();
