const { District, Commune, Village, sequelize } = require('./models');

async function clean() {
  const transaction = await sequelize.transaction();
  try {
    console.log('Cleaning Districts...');
    const districts = await District.findAll({ order: [['id', 'ASC']] });
    const dMap = new Map();
    for (const d of districts) {
       const key = `${d.province_id}-${d.name}`;
       if (dMap.has(key)) {
           const keptId = dMap.get(key);
           // update communes pointing to d.id to point to keptId
           await Commune.update({ district_id: keptId }, { where: { district_id: d.id }, transaction });
           await District.destroy({ where: { id: d.id }, transaction });
       } else {
           dMap.set(key, d.id);
       }
    }

    console.log('Cleaning Communes...');
    const communes = await Commune.findAll({ order: [['id', 'ASC']] });
    const cMap = new Map();
    for (const c of communes) {
       const key = `${c.district_id}-${c.name}`;
       if (cMap.has(key)) {
           const keptId = cMap.get(key);
           await Village.update({ commune_id: keptId }, { where: { commune_id: c.id }, transaction });
           await Commune.destroy({ where: { id: c.id }, transaction });
       } else {
           cMap.set(key, c.id);
       }
    }

    console.log('Cleaning Villages...');
    const villages = await Village.findAll({ order: [['id', 'ASC']] });
    const vMap = new Map();
    for (const v of villages) {
       const key = `${v.commune_id}-${v.name}`;
       if (vMap.has(key)) {
           await Village.destroy({ where: { id: v.id }, transaction });
       } else {
           vMap.set(key, v.id);
       }
    }

    await transaction.commit();
    console.log('Done cleaning up duplicates.');
  } catch (err) {
    await transaction.rollback();
    console.error('Error:', err);
  }
  process.exit(0);
}
clean();
