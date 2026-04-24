const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('Testing API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    });
    console.log('Health check:', healthResponse.status, healthResponse.data);
    console.log('');

    // Test login endpoint
    console.log('2. Testing login endpoint...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'guest@sentinel.com',
      password: 'guest123'
    });
    console.log('Login response:', loginResponse.status, loginResponse.data);
    console.log('');

    if (loginResponse.data.token) {
      const token = loginResponse.data.token;

      // Test get zones endpoint
      console.log('3. Testing get zones endpoint...');
      const zonesResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/venue/zones',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Zones response:', zonesResponse.status, zonesResponse.data);
      console.log('');

      // Test get incidents endpoint
      console.log('4. Testing get incidents endpoint...');
      const incidentsResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/incidents',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Incidents response:', incidentsResponse.status, incidentsResponse.data);
      console.log('');

      // Test create incident endpoint
      console.log('5. Testing create incident endpoint...');
      const createIncidentResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/incidents',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }, {
        type: 'smoke_fire',
        severity: 'high',
        zone: 'Building A - Floor 1',
        room: 'Room 101',
        note: 'Test incident from API test',
        source: 'guest'
      });
      console.log('Create incident response:', createIncidentResponse.status, createIncidentResponse.data);
      console.log('');
    }

    console.log('API testing completed successfully!');

  } catch (error) {
    console.error('API testing failed:', error);
  }
}

testAPI();
