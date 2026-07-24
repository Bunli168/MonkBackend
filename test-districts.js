const { District, Commune } = require('./models');

async function test() {
   const d = await District.findAll({ where: { name: 'ទួលគោក' }, raw: true });
   console.log("Districts named 'ទួលគោក':", d);
}
test();
