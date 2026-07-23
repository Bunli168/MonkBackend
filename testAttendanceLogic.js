const { User, Attendance, RetreatEvent, Payment, sequelize } = require('./models');
const attendanceController = require('./controllers/attendanceController');
const ledgerController = require('./controllers/ledgerController');

async function test() {
  try {
    console.log('--- Starting Attendance Flow Test ---');
    
    // 1. Create or ensure a test season exists and is active
    let season = await RetreatEvent.findOne({ where: { is_active: true } });
    if (!season) {
      season = await RetreatEvent.create({
        name: 'Test Season ' + new Date().getTime(),
        start_date: new Date('2029-01-01'),
        // End date in the future
        end_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), 
        is_active: true
      });
      console.log('Created new active season:', season.name);
    } else {
      console.log('Using existing active season:', season.name);
    }

    // 2. Find a user to test with
    const user = await User.findOne({ where: { role_id: 3 } });
    if (!user) {
      console.log('No normal user found to test with.');
      return;
    }
    console.log('Testing with user:', user.email);

    // 3. Delete existing attendances for this user and season to start fresh
    await Attendance.destroy({ where: { user_id: user.id, retreat_event_id: season.id } });
    await Payment.destroy({ where: { user_id: user.id, retreat_event_id: season.id } });

    // 4. Simulate taking attendance (absent)
    const att = await Attendance.create({
      user_id: user.id,
      retreat_event_id: season.id,
      date: new Date('2029-01-01'),
      status: 'absent',
      recorded_by: 1, // dummy admin ID
      notes: 'Test absence'
    });
    console.log('Successfully recorded absence:', att.id);

    // 5. Test Ledger points calculation
    // Mock req, res for ledgerController
    const req = { query: {} };
    let ledgerData = null;
    const res = {
      status: (code) => ({
        json: (data) => { ledgerData = data; }
      })
    };

    await ledgerController.getLedger(req, res);
    
    if (ledgerData && ledgerData.success) {
      const userLedger = ledgerData.data.find(l => l.user_id === user.id);
      console.log('--- Ledger Status ---');
      console.log(userLedger);
      
      if (userLedger.active_points === 2) {
        console.log('✅ Points calculated correctly (1 absence = 2 points)');
      } else {
        console.log('❌ Points mismatch! Expected 2, got', userLedger.active_points);
      }
    }

    console.log('--- Flow Test Completed ---');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

test();
