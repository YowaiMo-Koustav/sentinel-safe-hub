const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { requireRole, isAdmin } = require('../middleware/auth');
const db = require('../database/connection');

const router = express.Router();

// Validation schemas
const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('guest', 'staff', 'responder', 'admin').required()
});

const updateUserSchema = Joi.object({
  displayName: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional()
});

// Get all users (admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at,
             GROUP_CONCAT(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = u.id AND role = ?)';
      params.push(role);
    }

    if (search) {
      query += ' AND (u.email LIKE ? OR u.display_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    const users = await db.all(query, params);

    // Parse roles
    users.forEach(user => {
      user.roles = user.roles ? user.roles.split(',') : [];
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user by ID (admin only)
router.get('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.get(`
      SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at,
             GROUP_CONCAT(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.roles = user.roles ? user.roles.split(',') : [];

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { displayName, email } = value;
    const io = req.app.get('io');

    // Check if user exists
    const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new email conflicts with existing user
    if (email && email !== existingUser.email) {
      const emailConflict = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailConflict) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (displayName !== undefined) {
      updates.push('display_name = ?');
      params.push(displayName);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.run(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Get updated user
    const user = await db.get(`
      SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at,
             GROUP_CONCAT(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    user.roles = user.roles ? user.roles.split(',') : [];

    // Emit real-time update
    io.emit('user_updated', user);

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Add role to user (admin only)
router.post('/:id/roles', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { role } = value;
    const io = req.app.get('io');

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has this role
    const existingRole = await db.get('SELECT id FROM user_roles WHERE user_id = ? AND role = ?', [id, role]);
    if (existingRole) {
      return res.status(409).json({ error: 'User already has this role' });
    }

    // Add role
    await db.run(`
      INSERT INTO user_roles (id, user_id, role, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [uuidv4(), id, role]);

    // Get updated user
    const updatedUser = await db.get(`
      SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at,
             GROUP_CONCAT(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    updatedUser.roles = updatedUser.roles ? updatedUser.roles.split(',') : [];

    // Emit real-time update
    io.emit('user_role_added', { userId: id, role, user: updatedUser });

    res.json({
      message: 'Role added successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ error: 'Failed to add role' });
  }
});

// Remove role from user (admin only)
router.delete('/:id/roles/:role', requireRole('admin'), async (req, res) => {
  try {
    const { id, role } = req.params;
    const io = req.app.get('io');

    // Validate role
    if (!['guest', 'staff', 'responder', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has this role
    const existingRole = await db.get('SELECT id FROM user_roles WHERE user_id = ? AND role = ?', [id, role]);
    if (!existingRole) {
      return res.status(404).json({ error: 'User does not have this role' });
    }

    // Prevent removing admin role from the last admin
    if (role === 'admin') {
      const adminCount = await db.get(`
        SELECT COUNT(*) as count 
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.id
        WHERE ur.role = 'admin'
      `);
      
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot remove admin role from the last admin user' });
      }
    }

    // Remove role
    await db.run('DELETE FROM user_roles WHERE user_id = ? AND role = ?', [id, role]);

    // Get updated user
    const updatedUser = await db.get(`
      SELECT u.id, u.email, u.display_name, u.created_at, u.updated_at,
             GROUP_CONCAT(ur.role) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);

    updatedUser.roles = updatedUser.roles ? updatedUser.roles.split(',') : [];

    // Emit real-time update
    io.emit('user_role_removed', { userId: id, role, user: updatedUser });

    res.json({
      message: 'Role removed successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    // Check if user exists
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting admin users
    const userRoles = await db.all('SELECT role FROM user_roles WHERE user_id = ?', [id]);
    const hasAdminRole = userRoles.some(r => r.role === 'admin');
    if (hasAdminRole) {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    // Check if user has reported incidents
    const incidentCount = await db.get('SELECT COUNT(*) as count FROM incidents WHERE reporter_id = ?', [id]);
    if (incidentCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete user: has reported incidents' });
    }

    // Delete user (cascades to user_roles)
    await db.run('DELETE FROM users WHERE id = ?', [id]);

    // Emit real-time update
    io.emit('user_deleted', { id });

    res.json({
      message: 'User deleted successfully',
      user
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', requireRole('admin'), async (req, res) => {
  try {
    const stats = {};

    // Total users
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    stats.totalUsers = totalUsers.count;

    // Users by role
    const usersByRole = await db.all(`
      SELECT ur.role, COUNT(*) as count
      FROM user_roles ur
      GROUP BY ur.role
    `);
    stats.usersByRole = usersByRole.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, {});

    // New users in last 30 days
    const newUsers = await db.get(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= datetime('now', '-30 days')
    `);
    stats.newUsersLast30Days = newUsers.count;

    // Active users (users who reported incidents in last 30 days)
    const activeUsers = await db.get(`
      SELECT COUNT(DISTINCT reporter_id) as count
      FROM incidents
      WHERE created_at >= datetime('now', '-30 days')
    `);
    stats.activeUsersLast30Days = activeUsers.count;

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

module.exports = router;
