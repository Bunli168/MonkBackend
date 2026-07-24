const { sequelize, MonkSurvey, Province, District, Commune, Village } = require('./models');

async function fix() {
  const provinces = await Province.findAll({ raw: true });
  const districts = await District.findAll({ raw: true });
  const communes = await Commune.findAll({ raw: true });
  const villages = await Village.findAll({ raw: true });

  const surveys = await MonkSurvey.findAll();
  
  let updatedCount = 0;
  for (const survey of surveys) {
    let updated = false;

    // Helper function to update fields
    const fixField = (field, list) => {
      const val = survey[field];
      if (val && isNaN(val)) { // if it's text (not a numeric code)
        // Try to find it in the list by name (khmer)
        const match = list.find(item => item.name === val);
        if (match) {
          survey[field] = match.id;
          updated = true;
          console.log(`Updated ${field}: ${val} -> ${match.id}`);
        } else {
          console.log(`WARNING: Could not find match for ${field}: ${val}`);
        }
      }
    };

    fixField('pob_province_id', provinces);
    fixField('pob_district_id', districts);
    fixField('pob_commune_id', communes);
    fixField('pob_village_id', villages);

    fixField('ordination_province_id', provinces);
    fixField('ordination_district_id', districts);
    fixField('ordination_commune_id', communes);

    fixField('current_province_id', provinces);
    fixField('current_district_id', districts);
    fixField('current_commune_id', communes);

    if (updated) {
      await survey.save();
      updatedCount++;
    }
  }
  
  console.log(`Fixed ${updatedCount} surveys.`);
}
fix();
