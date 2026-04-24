const http = require('http');

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

async function testRegistration() {
  console.log('Testing user registration...\n');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'newuser@test.com',
      password: 'newuser123',
      displayName: 'New Test User',
      role: 'guest'
    });
    
    console.log('Registration Response:', response.status);
    if (response.data.token) {
      console.log('Registration: SUCCESS - New user created');
      console.log('New User:', response.data.user);
    } else {
      console.log('Registration: FAILED -', response.data);
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
  }
}

testRegistration();
