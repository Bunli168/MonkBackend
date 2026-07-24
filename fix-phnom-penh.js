const { Province, District, Commune, Village, sequelize } = require('./models');

async function fix() {
  const transaction = await sequelize.transaction();
  try {
    const pp1 = await Province.findOne({ where: { name: 'ភ្នំពេញ' } });
    const pp2 = await Province.findOne({ where: { name: 'រាជធានីភ្នំពេញ' } });

    if (pp1 && pp2) {
      console.log('Both exist. Updating everything from pp1 to pp2...');
      
      // We don't want to lose districts, but pp2 already has all of them.
      // Are there any districts in pp1 that are NOT in pp2? 
      // Just delete pp1's districts because pp2's districts are from the official API.
      const pp1Districts = await District.findAll({ where: { province_id: pp1.id } });
      for (const d of pp1Districts) {
         // delete communes & villages under this district
         const communes = await Commune.findAll({ where: { district_id: d.id } });
         for (const c of communes) {
            await Village.destroy({ where: { commune_id: c.id }, transaction });
         }
         await Commune.destroy({ where: { district_id: d.id }, transaction });
      }
      await District.destroy({ where: { province_id: pp1.id }, transaction });
      
      // Move any User addresses or MonkSurveys referencing pp1 to pp2?
      // Since it's dev database, maybe just delete pp1.
      await Province.destroy({ where: { id: pp1.id }, transaction });
      
      // Rename pp2 to 'ភ្នំពេញ' so it looks clean
      await pp2.update({ name: 'ភ្នំពេញ (រាជធានី)' }, { transaction });
      
      console.log('Fixed! Deleted duplicate Phnom Penh and renamed the complete one.');
    } else {
      console.log('No duplicates found.');
    }
    
    // Also remove duplicate districts inside pp2 if any.
    if (pp2) {
       const districts = await District.findAll({ where: { province_id: pp2.id }, order: [['id', 'ASC']] });
       const seen = new Set();
       for (const d of districts) {
           if (seen.has(d.name)) {
               console.log('Deleting duplicate district:', d.name);
               // delete cascades? (wait, village -> commune -> district)
               const communes = await Commune.findAll({ where: { district_id: d.id } });
               for (const c of communes) {
                  await Village.destroy({ where: { commune_id: c.id }, transaction });
               }
               await Commune.destroy({ where: { district_id: d.id }, transaction });
               await d.destroy({ transaction });
           } else {
               seen.add(d.name);
           }
       }
    }

    await transaction.commit();
    console.log('Done.');
  } catch (err) {
    await transaction.rollback();
    console.error(err);
  }
  process.exit(0);
}

fix();
