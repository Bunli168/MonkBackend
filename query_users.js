const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('monk_db', 'root', 'Ant123', {
  host: 'localhost',
  dialect: 'mysql'
});
sequelize.query('SELECT u.id, u.email, u.role_id, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.role_id = 2;').then(([results]) => {
  console.log(results);
  process.exit(0);
}).catch(console.error);
