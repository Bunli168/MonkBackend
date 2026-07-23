const sequelize = require('./config/database');
const { FinePayment } = require('./models');

async function syncFinePayment() {
    try {
        await FinePayment.sync({ alter: true });
        console.log("FinePayment table synced successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

syncFinePayment();
