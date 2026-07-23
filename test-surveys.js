const { MonkSurvey, UserProfile } = require('./models');

async function test() {
  try {
    const surveys = await MonkSurvey.findAll({ limit: 10 });
    surveys.forEach(s => console.log(`Survey ${s.id}: user=${s.user_id}, name="${s.surname_name}", dob="${s.date_of_birth}"`));

    const profiles = await UserProfile.findAll({ limit: 10 });
    profiles.forEach(p => console.log(`Profile ${p.id}: user=${p.user_id}, fname_kh="${p.first_name_kh}", lname_kh="${p.last_name_kh}"`));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
