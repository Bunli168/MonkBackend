const { User, Role } = require('./models');
const { Op } = require('sequelize');

async function test() {
    const superAdmins = await User.findAll({ where: { role_id: 1, telegram_chat_id: { [Op.not]: null } } });
    console.log("Super Admins with TG:", superAdmins.map(u => ({ id: u.id, role_id: u.role_id })));
    
    const admins = await User.findAll({ where: { role_id: 2, telegram_chat_id: { [Op.not]: null } } });
    console.log("Admins with TG:", admins.map(u => ({ id: u.id, role_id: u.role_id })));
}
test();
