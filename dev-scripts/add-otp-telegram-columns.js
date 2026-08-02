const sequelize = require('../config/database');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const queryInterface = sequelize.getQueryInterface();

    console.log('Adding otp_telegram_chat_id...');
    try {
        await queryInterface.addColumn('users', 'otp_telegram_chat_id', {
            type: sequelize.Sequelize.STRING(255),
            allowNull: true,
        });
        console.log('Added otp_telegram_chat_id');
    } catch(e) {
        console.log('otp_telegram_chat_id might already exist:', e.message);
    }

    console.log('Adding otp_telegram_username...');
    try {
        await queryInterface.addColumn('users', 'otp_telegram_username', {
            type: sequelize.Sequelize.STRING(255),
            allowNull: true,
        });
        console.log('Added otp_telegram_username');
    } catch(e) {
        console.log('otp_telegram_username might already exist:', e.message);
    }

    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

run();
