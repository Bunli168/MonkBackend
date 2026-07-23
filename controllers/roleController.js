const Role = require('../models/Role');

const roleController = {
  // Get all roles
  async getAll(req, res) {
    try {
      const roles = await Role.findAll();
      res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch roles'
      });
    }
  },

  // Get role by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const role = await Role.findByPk(id);
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      res.status(200).json({
        success: true,
        data: role
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch role'
      });
    }
  },

  // Create role
  async create(req, res) {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        });
      }

      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Role name already exists'
        });
      }

      const role = await Role.create({ name, description });
      
      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create role'
      });
    }
  },

  // Update role
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      
      const existingRole = await Role.findByPk(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      if (name && name !== existingRole.name) {
        const roleNameExists = await Role.findOne({ where: { name } });
        if (roleNameExists) {
          return res.status(400).json({
            success: false,
            message: 'Role name already exists'
          });
        }
      }

      await Role.update({ name: name || existingRole.name, description: description || existingRole.description }, { where: { id } });
      const updatedRole = await Role.findByPk(id);
      
      res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: updatedRole
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update role'
      });
    }
  },

  // Delete role
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const existingRole = await Role.findByPk(id);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      await Role.destroy({ where: { id } });
      
      res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete role (may be constrained by foreign keys)'
      });
    }
  }
};

module.exports = roleController;
