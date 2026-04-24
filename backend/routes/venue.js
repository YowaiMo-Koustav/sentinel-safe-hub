const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { requireRole } = require('../middleware/auth');
const db = require('../database/connection');

const router = express.Router();

// Validation schemas
const createZoneSchema = Joi.object({
  name: Joi.string().required(),
  building: Joi.string().optional(),
  floor: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('normal', 'evacuating', 'closed', 'maintenance').default('normal'),
  evacuation_path_id: Joi.string().optional()
});

const createEvacuationPathSchema = Joi.object({
  name: Joi.string().required(),
  from_zone: Joi.string().required(),
  to_zone: Joi.string().required(),
  steps: Joi.array().items(Joi.object()).default([]),
  status: Joi.string().valid('clear', 'blocked', 'congested').default('clear'),
  estimated_seconds: Joi.number().integer().min(1).optional()
});

const updateZoneSchema = Joi.object({
  name: Joi.string().optional(),
  building: Joi.string().optional(),
  floor: Joi.string().optional(),
  capacity: Joi.number().integer().min(1).optional(),
  status: Joi.string().valid('normal', 'evacuating', 'closed', 'maintenance').optional(),
  evacuation_path_id: Joi.string().optional()
});

const updateEvacuationPathSchema = Joi.object({
  name: Joi.string().optional(),
  from_zone: Joi.string().optional(),
  to_zone: Joi.string().optional(),
  steps: Joi.array().items(Joi.object()).optional(),
  status: Joi.string().valid('clear', 'blocked', 'congested').optional(),
  estimated_seconds: Joi.number().integer().min(1).optional()
});

// ZONES MANAGEMENT

// Get all zones
router.get('/zones', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT z.*, 
             ep.name as evacuation_path_name,
             ep.status as evacuation_path_status
      FROM zones z
      LEFT JOIN evacuation_paths ep ON z.evacuation_path_id = ep.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND z.status = ?';
      params.push(status);
    }

    query += ' ORDER BY z.building, z.floor, z.name';

    const zones = await db.all(query, params);

    res.json(zones);
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

// Get single zone by ID
router.get('/zones/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const zone = await db.get(`
      SELECT z.*, 
             ep.name as evacuation_path_name,
             ep.status as evacuation_path_status,
             ep.steps as evacuation_path_steps
      FROM zones z
      LEFT JOIN evacuation_paths ep ON z.evacuation_path_id = ep.id
      WHERE z.id = ?
    `, [id]);

    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    res.json(zone);
  } catch (error) {
    console.error('Get zone error:', error);
    res.status(500).json({ error: 'Failed to fetch zone' });
  }
});

// Create new zone (admin only)
router.post('/zones', requireRole('admin'), async (req, res) => {
  try {
    const { error, value } = createZoneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, building, floor, capacity, status, evacuation_path_id } = value;
    const io = req.app.get('io');

    // Check if zone name already exists
    const existingZone = await db.get('SELECT id FROM zones WHERE name = ?', [name]);
    if (existingZone) {
      return res.status(409).json({ error: 'Zone with this name already exists' });
    }

    const zoneId = uuidv4();

    await db.run(`
      INSERT INTO zones (id, name, building, floor, capacity, status, evacuation_path_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [zoneId, name, building, floor, capacity, status, evacuation_path_id]);

    // Get the created zone
    const zone = await db.get('SELECT * FROM zones WHERE id = ?', [zoneId]);

    // Emit real-time update
    io.emit('zone_created', zone);

    res.status(201).json({
      message: 'Zone created successfully',
      zone
    });
  } catch (error) {
    console.error('Create zone error:', error);
    res.status(500).json({ error: 'Failed to create zone' });
  }
});

// Update zone (admin only)
router.put('/zones/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateZoneSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, building, floor, capacity, status, evacuation_path_id } = value;
    const io = req.app.get('io');

    // Check if zone exists
    const existingZone = await db.get('SELECT * FROM zones WHERE id = ?', [id]);
    if (!existingZone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Check if new name conflicts with existing zone
    if (name && name !== existingZone.name) {
      const nameConflict = await db.get('SELECT id FROM zones WHERE name = ? AND id != ?', [name, id]);
      if (nameConflict) {
        return res.status(409).json({ error: 'Zone with this name already exists' });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (building !== undefined) {
      updates.push('building = ?');
      params.push(building);
    }
    if (floor !== undefined) {
      updates.push('floor = ?');
      params.push(floor);
    }
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(capacity);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (evacuation_path_id !== undefined) {
      updates.push('evacuation_path_id = ?');
      params.push(evacuation_path_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.run(`
      UPDATE zones 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Get updated zone
    const zone = await db.get(`
      SELECT z.*, 
             ep.name as evacuation_path_name,
             ep.status as evacuation_path_status
      FROM zones z
      LEFT JOIN evacuation_paths ep ON z.evacuation_path_id = ep.id
      WHERE z.id = ?
    `, [id]);

    // Emit real-time update
    io.emit('zone_updated', zone);

    res.json({
      message: 'Zone updated successfully',
      zone
    });
  } catch (error) {
    console.error('Update zone error:', error);
    res.status(500).json({ error: 'Failed to update zone' });
  }
});

// Delete zone (admin only)
router.delete('/zones/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    // Check if zone exists
    const zone = await db.get('SELECT * FROM zones WHERE id = ?', [id]);
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    // Check if zone is referenced by any incidents
    const incidentCount = await db.get('SELECT COUNT(*) as count FROM incidents WHERE zone = ?', [zone.name]);
    if (incidentCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete zone: referenced by incidents' });
    }

    await db.run('DELETE FROM zones WHERE id = ?', [id]);

    // Emit real-time update
    io.emit('zone_deleted', { id });

    res.json({
      message: 'Zone deleted successfully',
      zone
    });
  } catch (error) {
    console.error('Delete zone error:', error);
    res.status(500).json({ error: 'Failed to delete zone' });
  }
});

// EVACUATION PATHS MANAGEMENT

// Get all evacuation paths
router.get('/evacuation-paths', async (req, res) => {
  try {
    const { status, from_zone } = req.query;

    let query = 'SELECT * FROM evacuation_paths WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (from_zone) {
      query += ' AND from_zone = ?';
      params.push(from_zone);
    }

    query += ' ORDER BY name';

    const paths = await db.all(query, params);

    // Parse steps JSON
    paths.forEach(path => {
      try {
        path.steps = JSON.parse(path.steps || '[]');
      } catch (e) {
        path.steps = [];
      }
    });

    res.json(paths);
  } catch (error) {
    console.error('Get evacuation paths error:', error);
    res.status(500).json({ error: 'Failed to fetch evacuation paths' });
  }
});

// Get single evacuation path by ID
router.get('/evacuation-paths/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const path = await db.get('SELECT * FROM evacuation_paths WHERE id = ?', [id]);

    if (!path) {
      return res.status(404).json({ error: 'Evacuation path not found' });
    }

    // Parse steps JSON
    try {
      path.steps = JSON.parse(path.steps || '[]');
    } catch (e) {
      path.steps = [];
    }

    res.json(path);
  } catch (error) {
    console.error('Get evacuation path error:', error);
    res.status(500).json({ error: 'Failed to fetch evacuation path' });
  }
});

// Create new evacuation path (admin only)
router.post('/evacuation-paths', requireRole('admin'), async (req, res) => {
  try {
    const { error, value } = createEvacuationPathSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, from_zone, to_zone, steps, status, estimated_seconds } = value;
    const io = req.app.get('io');

    const pathId = uuidv4();

    await db.run(`
      INSERT INTO evacuation_paths (id, name, from_zone, to_zone, steps, status, estimated_seconds, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [pathId, name, from_zone, to_zone, JSON.stringify(steps), status, estimated_seconds]);

    // Get the created path
    const path = await db.get('SELECT * FROM evacuation_paths WHERE id = ?', [pathId]);

    // Parse steps JSON
    try {
      path.steps = JSON.parse(path.steps || '[]');
    } catch (e) {
      path.steps = [];
    }

    // Emit real-time update
    io.emit('evacuation_path_created', path);

    res.status(201).json({
      message: 'Evacuation path created successfully',
      path
    });
  } catch (error) {
    console.error('Create evacuation path error:', error);
    res.status(500).json({ error: 'Failed to create evacuation path' });
  }
});

// Update evacuation path (admin only)
router.put('/evacuation-paths/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateEvacuationPathSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, from_zone, to_zone, steps, status, estimated_seconds } = value;
    const io = req.app.get('io');

    // Check if path exists
    const existingPath = await db.get('SELECT * FROM evacuation_paths WHERE id = ?', [id]);
    if (!existingPath) {
      return res.status(404).json({ error: 'Evacuation path not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (from_zone !== undefined) {
      updates.push('from_zone = ?');
      params.push(from_zone);
    }
    if (to_zone !== undefined) {
      updates.push('to_zone = ?');
      params.push(to_zone);
    }
    if (steps !== undefined) {
      updates.push('steps = ?');
      params.push(JSON.stringify(steps));
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (estimated_seconds !== undefined) {
      updates.push('estimated_seconds = ?');
      params.push(estimated_seconds);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await db.run(`
      UPDATE evacuation_paths 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    // Get updated path
    const path = await db.get('SELECT * FROM evacuation_paths WHERE id = ?', [id]);

    // Parse steps JSON
    try {
      path.steps = JSON.parse(path.steps || '[]');
    } catch (e) {
      path.steps = [];
    }

    // Emit real-time update
    io.emit('evacuation_path_updated', path);

    res.json({
      message: 'Evacuation path updated successfully',
      path
    });
  } catch (error) {
    console.error('Update evacuation path error:', error);
    res.status(500).json({ error: 'Failed to update evacuation path' });
  }
});

// Delete evacuation path (admin only)
router.delete('/evacuation-paths/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    // Check if path exists
    const path = await db.get('SELECT * FROM evacuation_paths WHERE id = ?', [id]);
    if (!path) {
      return res.status(404).json({ error: 'Evacuation path not found' });
    }

    // Check if path is referenced by any zones
    const zoneCount = await db.get('SELECT COUNT(*) as count FROM zones WHERE evacuation_path_id = ?', [id]);
    if (zoneCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete evacuation path: referenced by zones' });
    }

    await db.run('DELETE FROM evacuation_paths WHERE id = ?', [id]);

    // Emit real-time update
    io.emit('evacuation_path_deleted', { id });

    res.json({
      message: 'Evacuation path deleted successfully',
      path
    });
  } catch (error) {
    console.error('Delete evacuation path error:', error);
    res.status(500).json({ error: 'Failed to delete evacuation path' });
  }
});

module.exports = router;
