const { User, Attendance, RetreatEvent, sequelize } = require('./models');

async function generateData() {
  try {
    console.log('--- Generating Day-by-Day Attendance Data ---');
    
    // Fetch active year
    const activeYear = await RetreatEvent.findOne({ where: { is_active: true } });
    if (!activeYear) {
      console.log('No active season found.');
      return;
    }
    console.log('Active season:', activeYear.name);

    // Fetch all monks
    const monks = await User.findAll({ where: { role_id: 3 } }); // Assuming role_id 3 is Monk/User
    if (!monks.length) {
      console.log('No monks found.');
      return;
    }
    console.log(`Found ${monks.length} monks.`);

    // Clear existing attendances for this season
    await Attendance.destroy({ where: {} });
    console.log('Cleared existing attendances for this season.');

    // Generate data for the last 14 days
    const today = new Date();
    const daysToGenerate = 14;
    let recordsCreated = 0;

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Array to hold bulk creates for this day
      const dailyRecords = [];

      for (const monk of monks) {
        // Randomize status: 80% Present, 15% Absent, 5% Leave
        const rand = Math.random();
        let status = 'present';
        if (rand > 0.95) status = 'permission';
        else if (rand > 0.80) status = 'absent';

        dailyRecords.push({
          user_id: monk.id,
          retreat_event_id: activeYear.id,
          date: dateStr,
          status: status,
          recorded_by: 1, // Admin ID
          notes: status === 'permission' ? 'Requested leave' : ''
        });
      }

      await Attendance.bulkCreate(dailyRecords);
      recordsCreated += dailyRecords.length;
      console.log(`Generated attendance for ${dateStr}`);
    }

    console.log(`Successfully generated ${recordsCreated} attendance records!`);
  } catch (error) {
    console.error('Failed to generate data:', error);
  } finally {
    process.exit(0);
  }
}

generateData();
