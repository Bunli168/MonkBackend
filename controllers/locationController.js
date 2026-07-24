const { Province, District, Commune, Village } = require('../models');

const locationController = {
  async getAll(req, res) {
    try {
      // Fetch all with attributes
      const provinces = await Province.findAll({ raw: true });
      const districts = await District.findAll({ raw: true });
      const communes = await Commune.findAll({ raw: true });
      const villages = await Village.findAll({ raw: true });

      // In order to emulate the MEF API format for the frontend without breaking existing logic,
      // we can just send back the separate arrays and the frontend can construct its maps!
      res.status(200).json({
        success: true,
        data: {
          provinces,
          districts,
          communes,
          villages
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = locationController;
