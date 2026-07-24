const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3006,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const token = JSON.parse(data).token;
    
    const req2 = http.request({
      hostname: 'localhost',
      port: 3006,
      path: '/api/monk-surveys',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res2) => {
      let data2 = '';
      res2.on('data', (chunk) => data2 += chunk);
      res2.on('end', () => {
        console.log('Status:', res2.statusCode);
        console.log('Response:', data2.slice(0, 500));
      });
    });
    req2.end();
  });
});

req.write(JSON.stringify({ email: 'admin@pagoda.com', password: 'password123' }));
req.end();
