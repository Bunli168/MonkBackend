const { Role, User } = require('./models');

async function test() {
    const roles = await Role.findAll();
    console.log("Roles:", roles.map(r => r.toJSON()));
}
test();
