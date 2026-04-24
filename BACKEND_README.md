# Sentinel Safe Hub - Complete Backend Implementation

## Overview

This document describes the complete Express.js backend implementation for the Sentinel Safe Hub emergency management system. The backend replaces all mock data with real-time database operations, authentication, and WebSocket support.

## Architecture

### Backend Technology Stack
- **Node.js** with **Express.js** for the REST API server
- **SQLite** for database storage (easily upgradeable to PostgreSQL/MySQL)
- **Socket.IO** for real-time WebSocket communication
- **JWT** for authentication and authorization
- **bcryptjs** for password hashing
- **Joi** for input validation
- **Helmet** for security headers
- **Rate limiting** for API protection

### Database Schema

The backend implements a comprehensive database schema with the following tables:

#### Core Tables
- **users** - User accounts and authentication
- **user_roles** - Role-based access control (guest, staff, responder, admin)
- **incidents** - Emergency incident tracking
- **incident_events** - Incident timeline and activity logs
- **zones** - Building zones and areas
- **evacuation_paths** - Emergency route management
- **demo_events** - Demo/simulation events

#### Security Features
- Row-level security through role-based permissions
- JWT token authentication
- Password hashing with bcrypt
- Input validation with Joi schemas
- Rate limiting and security headers

## API Endpoints

### Authentication (/api/auth)
- `POST /login` - User login
- `POST /register` - User registration
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile

### Incidents (/api/incidents)
- `GET /` - Get incidents (with filtering)
- `GET /:id` - Get single incident with events
- `POST /` - Create new incident
- `PUT /:id` - Update incident
- `POST /:id/claim` - Claim incident assignment
- `POST /:id/comments` - Add comment to incident

### Venue Management (/api/venue)
- `GET /zones` - Get all zones
- `GET /zones/:id` - Get single zone
- `POST /zones` - Create zone (admin only)
- `PUT /zones/:id` - Update zone (admin only)
- `DELETE /zones/:id` - Delete zone (admin only)
- `GET /evacuation-paths` - Get evacuation paths
- `POST /evacuation-paths` - Create evacuation path (admin only)
- `PUT /evacuation-paths/:id` - Update evacuation path (admin only)
- `DELETE /evacuation-paths/:id` - Delete evacuation path (admin only)

### User Management (/api/users)
- `GET /` - Get all users (admin only)
- `GET /:id` - Get single user (admin only)
- `PUT /:id` - Update user (admin only)
- `POST /:id/roles` - Add role to user (admin only)
- `DELETE /:id/roles/:role` - Remove role from user (admin only)
- `DELETE /:id` - Delete user (admin only)
- `GET /stats/overview` - Get user statistics (admin only)

## Real-time Features

### WebSocket Events
The backend emits real-time events for live updates:

- `incident_created` - New incident reported
- `incident_updated` - Incident status/assignment changed
- `incident_comment_added` - New comment added to incident
- `zone_created` - New zone added
- `zone_updated` - Zone status updated
- `zone_deleted` - Zone removed
- `evacuation_path_created` - New evacuation path
- `evacuation_path_updated` - Path status changed
- `evacuation_path_deleted` - Path removed

### Frontend Integration
Frontend hooks automatically connect to WebSocket for real-time updates:
- `useIncidents` - Live incident updates
- `useIncident` - Live single incident updates
- `useZones` - Live zone status updates
- `useEvacuationPaths` - Live path status updates

## Role-Based Access Control

### User Roles
- **guest** - Can report incidents, view own incidents
- **staff** - Can view all incidents, manage incidents
- **responder** - Can claim and respond to incidents
- **admin** - Full system access, user management, venue management

### Permission Matrix
| Action | Guest | Staff | Responder | Admin |
|--------|-------|-------|-----------|-------|
| Report incidents | ✅ | ✅ | ✅ | ✅ |
| View all incidents | ❌ | ✅ | ✅ | ✅ |
| Update incidents | Own only | ✅ | ✅ | ✅ |
| Claim incidents | ❌ | ❌ | ✅ | ✅ |
| Manage zones | ❌ | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ❌ | ✅ |

## Setup and Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
npm install
npm run dev
```

### Environment Variables
Create `.env` file in project root:
```env
# Backend API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

Create `.env` file in backend directory:
```env
PORT=5000
NODE_ENV=development
DB_PATH=./database.sqlite
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## Default Users

The system initializes with default users for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sentinel.com | admin123 |
| Responder | responder@sentinel.com | responder123 |
| Staff | staff@sentinel.com | staff123 |
| Guest | guest@sentinel.com | guest123 |

## Database

### SQLite Database
- File: `backend/database.sqlite`
- Auto-created on first run
- Includes sample data for testing

### Schema Migrations
Database schema is automatically initialized with:
- User management tables
- Incident tracking system
- Venue management
- Security functions and indexes

## Testing

### API Testing
Run the test script to verify all endpoints:
```bash
node test-api.cjs
```

### Manual Testing
1. Start backend: `cd backend && npm start`
2. Start frontend: `npm run dev`
3. Open browser to `http://localhost:5173`
4. Login with test credentials
5. Test incident reporting and management

## Security Features

### Authentication
- JWT token-based authentication
- Secure password hashing
- Token expiration handling
- Session management

### Authorization
- Role-based access control
- Permission checking middleware
- Resource ownership validation

### API Security
- Input validation with Joi
- SQL injection prevention
- XSS protection with Helmet
- Rate limiting
- CORS configuration

## Performance

### Database Optimization
- Indexed columns for fast queries
- Efficient query patterns
- Connection pooling ready

### Real-time Performance
- WebSocket connection management
- Event broadcasting optimization
- Automatic cleanup of disconnected clients

### Caching
- Frontend hook caching
- API response optimization
- Database query optimization

## Deployment

### Production Considerations
- Use environment variables for secrets
- Enable HTTPS with SSL certificates
- Use production database (PostgreSQL/MySQL)
- Set up proper logging and monitoring
- Configure reverse proxy (nginx/Apache)

### Docker Support
The backend can be containerized:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Monitoring and Logging

### Health Check
- Endpoint: `/health`
- Returns server status and uptime
- Used for load balancer health checks

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful error recovery

## Future Enhancements

### Planned Features
- Multi-tenant support
- Advanced analytics dashboard
- Mobile app API
- Integration with external emergency services
- Advanced notification system

### Scalability
- Database sharding support
- Microservices architecture ready
- Load balancing support
- Caching layer integration

## Support

For issues and questions:
1. Check the API documentation
2. Review the test cases
3. Check the database schema
4. Verify environment configuration

This backend implementation provides a solid foundation for the Sentinel Safe Hub emergency management system with real-time capabilities, comprehensive security, and scalable architecture.
