require('dotenv').config();
const { Role } = require('./models');
async function getRoles() {
    const roles = await Role.findAll();
    console.log(roles.map(r => r.toJSON()));
    process.exit(0);
}
getRoles();
