const { Commune, Village } = require('./models');

async function run() {
  const communes = await Commune.findAll();
  const seenC = new Set();
  let dupsC = 0;
  for (const c of communes) {
    const key = `${c.district_id}-${c.name}`;
    if (seenC.has(key)) dupsC++; else seenC.add(key);
  }
  
  const villages = await Village.findAll();
  const seenV = new Set();
  let dupsV = 0;
  for (const v of villages) {
    const key = `${v.commune_id}-${v.name}`;
    if (seenV.has(key)) dupsV++; else seenV.add(key);
  }
  
  console.log(`Duplicate Communes: ${dupsC}`);
  console.log(`Duplicate Villages: ${dupsV}`);
  process.exit(0);
}
run();
