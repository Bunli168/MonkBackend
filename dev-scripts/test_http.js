const http = require('http');
const { sequelize, User, Role } = require('./models');
const { generateAccessToken } = require('./utils/jwt');

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ include: [Role] });
    console.log("Found user:", user.email, user.Role.name);
    const token = generateAccessToken({ userId: user.id });
    
    const options = {
      hostname: 'localhost',
      port: 3006,
      path: '/api/reports',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = http.request(options, (res) => {
      console.log('HTTP Response Status:', res.statusCode);
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log('HTTP Response Data:', data);
        process.exit();
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e);
      process.exit();
    });
    
    req.end();
  } catch (e) {
    console.error("Error:", e.message);
    process.exit();
  }
})();
