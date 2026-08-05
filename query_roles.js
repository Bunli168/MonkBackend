const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('monk_db', 'root', 'Ant123', {
  host: 'localhost',
  dialect: 'mysql'
});
sequelize.query('SHOW TABLES').then(([results]) => {
  console.log(results);
  return sequelize.query('SELECT id, name FROM roles');
}).then(([results]) => {
  console.log(results);
  process.exit(0);
}).catch(console.error);
