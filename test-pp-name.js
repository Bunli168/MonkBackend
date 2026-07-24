const { Province } = require('./models');

async function test() {
   const p = await Province.findAll({ raw: true });
   console.log("Provinces:", p.map(x => x.name).join(', '));
}
test();
