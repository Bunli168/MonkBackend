const { Province, District } = require('./models');

async function run() {
  const pp = await Province.findOne({ where: { name: 'ភ្នំពេញ (រាជធានី)' } });
  if (pp) {
      const districts = await District.findAll({ where: { province_id: pp.id } });
      console.log('Districts for Phnom Penh:', districts.map(d => ({id: d.id, name: d.name})));
  }
  process.exit(0);
}
run();
