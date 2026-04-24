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

async function testLogin(email, password, label) {
  console.log(`\nTesting ${label} login...`);
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email,
      password
    });
    
    console.log(`${label} Login Response:`, response.status);
    if (response.data.token) {
      console.log(`${label} Login: SUCCESS - Token received`);
      console.log(`${label} User:`, response.data.user);
    } else {
      console.log(`${label} Login: FAILED -`, response.data);
    }
  } catch (error) {
    console.error(`${label} Login Error:`, error.message);
  }
}

async function testAllLogins() {
  console.log('Testing all login credentials...\n');
  
  await testLogin('admin@sentinel.com', 'admin123', 'Admin');
  await testLogin('responder@sentinel.com', 'responder123', 'Responder');
  await testLogin('staff@sentinel.com', 'staff123', 'Staff');
  await testLogin('guest@sentinel.com', 'guest123', 'Guest');
  
  console.log('\nLogin testing completed!');
}

testAllLogins();
