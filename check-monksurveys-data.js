const { MonkSurvey } = require('./models');

async function check() {
  const surveys = await MonkSurvey.findAll({ raw: true });
  console.log(surveys.map(s => ({
    id: s.id,
    current_province_id: s.current_province_id,
    current_district_id: s.current_district_id,
    pob_province_id: s.pob_province_id
  })));
}
check();
