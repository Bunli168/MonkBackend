const { Kut } = require('../models');

const kutService = {
  async getAllKuts() {
    return await Kut.findAll({ order: [['name', 'ASC']] });
  },

  async getKutById(id) {
    const kut = await Kut.findByPk(id);
    if (!kut) throw new Error('Kut not found');
    return kut;
  },

  async createKut(kutData) {
    if (!kutData.name) throw new Error('Kut name is required');
    const existing = await Kut.findOne({ where: { name: kutData.name } });
    if (existing) throw new Error('Kut with this name already exists');
    return await Kut.create(kutData);
  },

  async updateKut(id, kutData) {
    const existing = await Kut.findByPk(id);
    if (!existing) throw new Error('Kut not found');
    if (kutData.name && kutData.name !== existing.name) {
      const nameExists = await Kut.findOne({ where: { name: kutData.name } });
      if (nameExists) throw new Error('Kut with this name already exists');
    }
    return await existing.update(kutData);
  },

  async deleteKut(id) {
    const existing = await Kut.findByPk(id);
    if (!existing) throw new Error('Kut not found');
    try {
      await existing.destroy();
      return { message: 'Kut deleted successfully' };
    } catch (error) {
      throw new Error('Cannot delete Kut. It might be referenced by other records.');
    }
  }
};
module.exports = kutService;