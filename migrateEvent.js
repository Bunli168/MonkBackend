const sequelize = require('./config/database');
const { RetreatEvent, RetreatRegistration, UserProfile, Attendance, Payment, EducationYear, User } = require('./models');

async function migrate() {
  try {
    console.log('Syncing database...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.sync({ alter: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('Creating default Event...');
    let event = await RetreatEvent.findOne({ where: { name: 'ចូលព្រះវស្សា ២០២៦' } });
    if (!event) {
      event = await RetreatEvent.create({
        name: 'ចូលព្រះវស្សា ២០២៦',
        start_date: new Date('2026-07-01'),
        end_date: new Date('2026-10-01'),
        is_active: true
      });
      console.log('Default event created.');
    } else {
      console.log('Default event already exists.');
    }

    // Migrate from UserProfile to RetreatRegistration
    console.log('Migrating seating rows to RetreatRegistration...');
    const profiles = await UserProfile.findAll();
    let migratedCount = 0;
    
    for (const profile of profiles) {
      if (profile.seating_row_id || profile.seat_number) {
        const [reg, created] = await RetreatRegistration.findOrCreate({
          where: {
            retreat_event_id: event.id,
            user_id: profile.user_id
          },
          defaults: {
            seating_row_id: profile.seating_row_id,
            seat_number: profile.seat_number
          }
        });
        if (created) migratedCount++;
      }
    }
    console.log(`Migrated ${migratedCount} seating rows.`);
    
    // Update existing attendances to link to retreat_event_id
    console.log('Updating attendances...');
    const activeYear = await EducationYear.findOne({ where: { is_active: true } });
    if (activeYear) {
      await Attendance.update(
        { retreat_event_id: event.id },
        { where: { education_year_id: activeYear.id, retreat_event_id: null } }
      );
      
      await Payment.update(
        { retreat_event_id: event.id },
        { where: { education_year_id: activeYear.id, retreat_event_id: null } }
      );
      console.log('Attendances and Payments updated.');
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
