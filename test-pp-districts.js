const { District } = require('./models');

async function test() {
   const d = await District.findAll({ where: { province_id: '12' }, raw: true });
   console.log("Districts in PP:", d.map(x => x.name).sort());
}
test();
