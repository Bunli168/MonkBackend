const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('mysql://root:@localhost:3306/monk_management');
const LeaveRequest = sequelize.define('LeaveRequest', {
    reason: DataTypes.TEXT,
    status: DataTypes.STRING
}, { tableName: 'LeaveRequests' });

async function run() {
    const reqs = await LeaveRequest.findAll();
    console.log(reqs.map(r => r.toJSON()));
    process.exit(0);
}
run();
