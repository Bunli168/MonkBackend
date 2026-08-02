const { Kut } = require('../models');

async function seedKuts() {
  try {
    console.log('Seeding Kuts 1 to 34...');
    const kuts = [];
    for (let i = 1; i <= 34; i++) {
      kuts.push({
        name: `Kut ${i}`,
        description: `Kut number ${i}`
      });
    }
    await Kut.bulkCreate(kuts);
    console.log('Successfully seeded 34 Kuts!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Kuts:', error);
    process.exit(1);
  }
}

seedKuts();
