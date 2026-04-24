const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('Request data:', JSON.stringify(data, null, 2));
    
    const req = http.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log('Response body:', body);
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e);
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLogin() {
  console.log('Testing admin login with detailed logging...\n');
  
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
      email: 'admin@sentinel.com',
      password: 'admin123'
    });
    
    console.log('Final response:', response);
  } catch (error) {
    console.error('Login test failed:', error);
  }
}

testLogin();
