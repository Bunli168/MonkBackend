const http = require('http');
const req = http.request('http://localhost:3006/health', (res) => {
  res.on('data', (chunk) => process.stdout.write(chunk));
});
req.end();
