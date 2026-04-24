const db = require('./connection');

async function initializeDatabase() {
  try {
    await db.connect();

    // Create tables in order to respect foreign key constraints
    
    // Users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User roles table
    await db.run(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('guest', 'staff', 'responder', 'admin')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, role)
      )
    `);

    // Zones table
    await db.run(`
      CREATE TABLE IF NOT EXISTS zones (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        building TEXT,
        floor TEXT,
        capacity INTEGER,
        status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'evacuating', 'closed', 'maintenance')),
        evacuation_path_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Evacuation paths table
    await db.run(`
      CREATE TABLE IF NOT EXISTS evacuation_paths (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        from_zone TEXT NOT NULL,
        to_zone TEXT NOT NULL,
        steps TEXT DEFAULT '[]',
        status TEXT DEFAULT 'clear' CHECK (status IN ('clear', 'blocked', 'congested')),
        estimated_seconds INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Incidents table
    await db.run(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('smoke_fire', 'crowd_surge', 'fall_injury', 'blocked_exit', 'power_failure', 'network_failure', 'suspicious_activity', 'other')),
        severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved')),
        zone TEXT NOT NULL,
        room TEXT,
        note TEXT,
        source TEXT DEFAULT 'guest' CHECK (source IN ('guest', 'staff', 'system', 'sensor')),
        reporter_id TEXT NOT NULL,
        reporter_name TEXT,
        assigned_to TEXT,
        assigned_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `);

    // Incident events table
    await db.run(`
      CREATE TABLE IF NOT EXISTS incident_events (
        id TEXT PRIMARY KEY,
        incident_id TEXT NOT NULL,
        actor_id TEXT,
        actor_name TEXT,
        event_type TEXT NOT NULL,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id)
      )
    `);

    // Demo events table
    await db.run(`
      CREATE TABLE IF NOT EXISTS demo_events (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        label TEXT,
        payload TEXT,
        scheduled_at DATETIME,
        played_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id ON incidents(reporter_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON incident_events(incident_id)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_zones_name ON zones(name)');
    await db.run('CREATE INDEX IF NOT EXISTS idx_evacuation_paths_from_zone ON evacuation_paths(from_zone)');

    // Insert initial data
    await insertInitialData();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function insertInitialData() {
  try {
    // Check if we already have data
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
      console.log('Database already contains data, skipping initial data insertion');
      return;
    }

    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');

    // Create default users
    const adminId = uuidv4();
    const responderId = uuidv4();
    const staffId = uuidv4();
    const guestId = uuidv4();

    const adminHash = await bcrypt.hash('admin123', 10);
    const responderHash = await bcrypt.hash('responder123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    const guestHash = await bcrypt.hash('guest123', 10);

    // Insert users
    await db.run(`
      INSERT INTO users (id, email, password_hash, display_name) VALUES
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)
    `, [
      adminId, 'admin@sentinel.com', adminHash, 'Admin User',
      responderId, 'responder@sentinel.com', responderHash, 'Responder User',
      staffId, 'staff@sentinel.com', staffHash, 'Staff User',
      guestId, 'guest@sentinel.com', guestHash, 'Guest User'
    ]);

    // Insert user roles
    await db.run(`
      INSERT INTO user_roles (id, user_id, role) VALUES
      (?, ?, ?),
      (?, ?, ?),
      (?, ?, ?),
      (?, ?, ?)
    `, [
      uuidv4(), adminId, 'admin',
      uuidv4(), responderId, 'responder',
      uuidv4(), staffId, 'staff',
      uuidv4(), guestId, 'guest'
    ]);

    // Insert sample zones
    const zone1Id = uuidv4();
    const zone2Id = uuidv4();
    const zone3Id = uuidv4();

    await db.run(`
      INSERT INTO zones (id, name, building, floor, capacity) VALUES
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)
    `, [
      zone1Id, 'Building A - Floor 1', 'Building A', '1', 100,
      zone2Id, 'Building A - Floor 2', 'Building A', '2', 150,
      zone3Id, 'Building B - Main Hall', 'Building B', '1', 300
    ]);

    // Insert evacuation paths
    await db.run(`
      INSERT INTO evacuation_paths (id, name, from_zone, to_zone, steps, estimated_seconds) VALUES
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)
    `, [
      uuidv4(), 'Emergency Exit A1', 'Building A - Floor 1', 'Outside', '[{"action": "exit", "location": "Main Door"}]', 60,
      uuidv4(), 'Emergency Exit B1', 'Building B - Main Hall', 'Outside', '[{"action": "exit", "location": "Side Door"}]', 45
    ]);

    console.log('Initial data inserted successfully');
  } catch (error) {
    console.error('Failed to insert initial data:', error);
    throw error;
  }
}

module.exports = { initializeDatabase };
