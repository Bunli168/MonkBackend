const { User, UserProfile, Role } = require('./models');
const { Op } = require('sequelize');

async function test() {
  const where = {};
  const userProfileWhere = {};
  
  const takerRole = await Role.findOne({ where: { name: 'Attendance Taker' } });
  if (takerRole) {
    where.role_id = { [Op.ne]: takerRole.id };
  }
  
  const stats = await User.findAll({
    where,
    include: [{ model: UserProfile, attributes: [] }],
    attributes: ['role_id', [require('sequelize').fn('COUNT', '*'), 'count']],
    group: ['role_id'],
    raw: true
  });
  console.log(stats);
  const total = stats.reduce((acc, stat) => acc + parseInt(stat.count, 10), 0);
  console.log("Total:", total);
}

test().catch(console.error).finally(() => process.exit());
