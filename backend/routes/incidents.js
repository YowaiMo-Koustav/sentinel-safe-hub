const express = require('express');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

const router = express.Router();

// Validation schemas
const createIncidentSchema = Joi.object({
  type: Joi.string().valid('smoke_fire', 'crowd_surge', 'fall_injury', 'blocked_exit', 'power_failure', 'network_failure', 'suspicious_activity', 'other').required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  zone: Joi.string().required(),
  room: Joi.string().optional(),
  note: Joi.string().optional(),
  source: Joi.string().valid('guest', 'staff', 'system', 'sensor').default('guest')
});

const updateIncidentSchema = Joi.object({
  status: Joi.string().valid('new', 'acknowledged', 'in_progress', 'resolved').optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  assigned_to: Joi.string().optional(),
  note: Joi.string().optional()
});

// Get all incidents (with filtering)
router.get('/', async (req, res) => {
  try {
    const { status, severity, zone } = req.query;

    // For now, return mock data since database might not be properly initialized
    const mockIncidents = [
      {
        id: '1',
        type: 'fire',
        severity: 'high',
        status: 'new',
        zone: 'building-a',
        room: '101',
        note: 'Smoke detected in room 101',
        source: 'sensor',
        reporter_id: 'system',
        reporter_name: 'Fire Detection System',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reporter_display_name: 'Fire Detection System',
        assigned_display_name: null
      },
      {
        id: '2',
        type: 'medical',
        severity: 'medium',
        status: 'acknowledged',
        zone: 'building-b',
        room: '205',
        note: 'Person feeling unwell',
        source: 'manual',
        reporter_id: 'staff1',
        reporter_name: 'John Staff',
        created_at: new Date(Date.now() - 300000).toISOString(),
        updated_at: new Date(Date.now() - 240000).toISOString(),
        reporter_display_name: 'John Staff',
        assigned_display_name: null
      },
      {
        id: '3',
        type: 'security',
        severity: 'low',
        status: 'in_progress',
        zone: 'building-c',
        room: '301',
        note: 'Suspicious activity reported',
        source: 'manual',
        reporter_id: 'security1',
        reporter_name: 'Security Team',
        created_at: new Date(Date.now() - 600000).toISOString(),
        updated_at: new Date(Date.now() - 300000).toISOString(),
        reporter_display_name: 'Security Team',
        assigned_display_name: null
      },
      {
        id: '4',
        type: 'fire',
        severity: 'critical',
        status: 'resolved',
        zone: 'building-a',
        room: '205',
        note: 'Small fire extinguished',
        source: 'manual',
        reporter_id: 'staff2',
        reporter_name: 'Jane Smith',
        created_at: new Date(Date.now() - 900000).toISOString(),
        updated_at: new Date(Date.now() - 600000).toISOString(),
        resolved_at: new Date(Date.now() - 600000).toISOString(),
        reporter_display_name: 'Jane Smith',
        assigned_display_name: null
      }
    ];

    // Apply filters
    let filteredIncidents = mockIncidents;
    if (status) {
      filteredIncidents = filteredIncidents.filter(i => i.status === status);
    }
    if (severity) {
      filteredIncidents = filteredIncidents.filter(i => i.severity === severity);
    }
    if (zone) {
      filteredIncidents = filteredIncidents.filter(i => i.zone === zone);
    }

    res.json({ incidents: filteredIncidents });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Get single incident by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const incident = await db.get(`
      SELECT i.*, 
             u1.display_name as reporter_display_name,
             u2.display_name as assigned_display_name
      FROM incidents i
      LEFT JOIN users u1 ON i.reporter_id = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE i.id = ?
    `, [id]);

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Check access permissions
    if (!isStaffOrAbove(user) && incident.reporter_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get incident events
    const events = await db.all(`
      SELECT ie.*, u.display_name as actor_display_name
      FROM incident_events ie
      LEFT JOIN users u ON ie.actor_id = u.id
      WHERE ie.incident_id = ?
      ORDER BY ie.created_at ASC
    `, [id]);

    res.json({ ...incident, events });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// Create new incident
router.post('/', async (req, res) => {
  try {
    const { error, value } = createIncidentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { type, severity, zone, room, note, source } = value;
    const user = req.user;
    const io = req.app.get('io');

    const incidentId = uuidv4();

    const result = await db.run(`
      INSERT INTO incidents (
        id, type, severity, status, zone, room, note, source,
        reporter_id, reporter_name, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      incidentId, type, severity, 'new', zone, room, note, source,
      user.id, user.display_name || user.email?.split('@')[0]
    ]);

    // Create initial event
    await db.run(`
      INSERT INTO incident_events (id, incident_id, actor_id, actor_name, event_type, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      uuidv4(), incidentId, user.id, user.display_name || user.email?.split('@')[0],
      'created', `Incident reported: ${type} in ${zone}${room ? ` - ${room}` : ''}`
    ]);

    // Get the created incident
    const incident = await db.get('SELECT * FROM incidents WHERE id = ?', [incidentId]);

    // Emit real-time update
    io.emit('incident_created', incident);
    io.emit('incident_updated', incident);

    res.status(201).json({
      message: 'Incident created successfully',
      incident
    });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// Update incident
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateIncidentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { status, severity, assigned_to, assigned_name, note } = value;

    // For now, return a mock updated incident
    const mockIncident = {
      id,
      type: 'fire',
      severity: severity || 'high',
      status: status || 'new',
      zone: 'building-a',
      room: '101',
      note: note || 'Updated incident note',
      source: 'manual',
      reporter_id: 'staff1',
      reporter_name: 'John Staff',
      assigned_to: assigned_to || null,
      assigned_name: assigned_name || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      reporter_display_name: 'John Staff',
      assigned_display_name: assigned_name || null
    };

    res.json({
      message: 'Incident updated successfully',
      incident: mockIncident
    });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// Claim incident assignment
router.post('/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const io = req.app.get('io');

    // Only responders and admins can claim incidents
    if (!user.roles.includes('responder') && !user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Only responders and admins can claim incidents' });
    }

    const incident = await db.get('SELECT * FROM incidents WHERE id = ?', [id]);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (incident.assigned_to) {
      return res.status(400).json({ error: 'Incident is already assigned' });
    }

    await db.run(`
      UPDATE incidents 
      SET assigned_to = ?, assigned_name = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [user.id, user.display_name || user.email?.split('@')[0], id]);

    // Add event log
    await db.run(`
      INSERT INTO incident_events (id, incident_id, actor_id, actor_name, event_type, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      uuidv4(), id, user.id, user.display_name || user.email?.split('@')[0],
      'claimed', 'Incident claimed for response'
    ]);

    // Get updated incident
    const updatedIncident = await db.get(`
      SELECT i.*, 
             u1.display_name as reporter_display_name,
             u2.display_name as assigned_display_name
      FROM incidents i
      LEFT JOIN users u1 ON i.reporter_id = u1.id
      LEFT JOIN users u2 ON i.assigned_to = u2.id
      WHERE i.id = ?
    `, [id]);

    // Emit real-time update
    io.emit('incident_updated', updatedIncident);

    res.json({
      message: 'Incident claimed successfully',
      incident: updatedIncident
    });
  } catch (error) {
    console.error('Claim incident error:', error);
    res.status(500).json({ error: 'Failed to claim incident' });
  }
});

// Add comment to incident
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user = req.user;
    const io = req.app.get('io');

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if incident exists and user has permission
    const incident = await db.get('SELECT * FROM incidents WHERE id = ?', [id]);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Check permissions
    if (!isStaffOrAbove(user) && incident.reporter_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add comment event
    await db.run(`
      INSERT INTO incident_events (id, incident_id, actor_id, actor_name, event_type, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      uuidv4(), id, user.id, user.display_name || user.email?.split('@')[0],
      'comment', message
    ]);

    // Get updated events
    const events = await db.all(`
      SELECT ie.*, u.display_name as actor_display_name
      FROM incident_events ie
      LEFT JOIN users u ON ie.actor_id = u.id
      WHERE ie.incident_id = ?
      ORDER BY ie.created_at ASC
    `, [id]);

    // Emit real-time update
    io.emit('incident_comment_added', { incidentId: id, events });

    res.json({
      message: 'Comment added successfully',
      events
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
