const { District } = require('./models');

async function run() {
  const districts = await District.findAll();
  const seen = new Set();
  const duplicates = [];
  for (const d of districts) {
    const key = `${d.province_id}-${d.name}`;
    if (seen.has(key)) {
        duplicates.push(d.name);
    } else {
        seen.add(key);
    }
  }
  console.log('Total duplicates found:', duplicates.length);
  if (duplicates.length > 0) {
      console.log('Duplicates:', duplicates.slice(0, 10));
  }
  process.exit(0);
}
run();
