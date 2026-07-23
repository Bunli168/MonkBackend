const { PublicContent } = require('../models');

const publicContentService = {
  async createContent(contentData) {
    return await PublicContent.create(contentData);
  },

  async getAllContent() {
    return await PublicContent.findAll({ order: [['published_at', 'DESC']] });
  },

  async getPublishedContent() {
    return await PublicContent.findAll({
      where: { is_published: true },
      order: [['published_at', 'DESC']]
    });
  },

  async getContentById(id) {
    const content = await PublicContent.findByPk(id);
    if (!content) throw new Error('Content not found');
    return content;
  },

  async updateContent(id, contentData) {
    const content = await PublicContent.findByPk(id);
    if (!content) throw new Error('Content not found');
    return await content.update(contentData);
  },

  async deleteContent(id) {
    const content = await PublicContent.findByPk(id);
    if (!content) throw new Error('Content not found');
    await content.destroy();
    return { message: 'Content deleted successfully' };
  }
};
module.exports = publicContentService;