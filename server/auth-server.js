const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.AUTH_PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// User database with specified credentials
const users = [
  {
    id: '1',
    email: 'admin@sentinel.com',
    password: '$2b$10$YourHashedPasswordHere', // Will be hashed
    displayName: 'Administrator',
    roles: ['admin'],
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'responder@sentinel.com',
    password: '$2b$10$YourHashedPasswordHere',
    displayName: 'Emergency Responder',
    roles: ['responder'],
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    email: 'staff@sentinel.com',
    password: '$2b$10$YourHashedPasswordHere',
    displayName: 'Staff Member',
    roles: ['staff'],
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    email: 'guest@sentinel.com',
    password: '$2b$10$YourHashedPasswordHere',
    displayName: 'Guest User',
    roles: ['guest'],
    createdAt: new Date().toISOString()
  }
];

// Hash passwords on startup
async function hashPasswords() {
  const saltRounds = 10;
  
  users[0].password = await bcrypt.hash('admin123', saltRounds);
  users[1].password = await bcrypt.hash('responder123', saltRounds);
  users[2].password = await bcrypt.hash('staff123', saltRounds);
  users[3].password = await bcrypt.hash('guest123', saltRounds);
  
  console.log('Passwords hashed successfully');
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        displayName: user.displayName, 
        roles: user.roles 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint (for future use)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName, role = 'guest' } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and display name are required' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      displayName,
      roles: [role],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        displayName: newUser.displayName, 
        roles: newUser.roles 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Refresh token
app.post('/api/auth/refresh', authenticateToken, (req, res) => {
  const token = jwt.sign(
    { 
      id: req.user.id, 
      email: req.user.email, 
      displayName: req.user.displayName, 
      roles: req.user.roles 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token });
});

// Logout endpoint (client-side only, but we can track if needed)
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In a real app, you might want to invalidate tokens
  res.json({ message: 'Logged out successfully' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Authentication Service'
  });
});

// Start server
hashPasswords().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Authentication server running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
    console.log('');
    console.log('👥 Default users:');
    console.log('   Admin: admin@sentinel.com / admin123');
    console.log('   Responder: responder@sentinel.com / responder123');
    console.log('   Staff: staff@sentinel.com / staff123');
    console.log('   Guest: guest@sentinel.com / guest123');
  });
});

module.exports = app;
