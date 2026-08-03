const { User, Role } = require('./models');
User.findByPk(1, { include: [{ model: Role }] }).then(u => {
    console.log("User 1 role:", u?.Role?.name);
}).catch(console.error);
