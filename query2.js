const { Province, District } = require('./models');

async function run() {
  const pp1 = await Province.findOne({ where: { name: 'ភ្នំពេញ' } });
  if (pp1) {
      const districts1 = await District.findAll({ where: { province_id: pp1.id } });
      console.log('ភ្នំពេញ districts:', districts1.map(d => d.name));
  }

  const pp2 = await Province.findOne({ where: { name: 'រាជធានីភ្នំពេញ' } });
  if (pp2) {
      const districts2 = await District.findAll({ where: { province_id: pp2.id } });
      console.log('រាជធានីភ្នំពេញ districts:', districts2.map(d => d.name));
  }
  process.exit(0);
}
run();
