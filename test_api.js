const jwt = require('jsonwebtoken');
const config = require('./config/index.js');
const token = jwt.sign({ id: 1 }, config.jwtSecret, { expiresIn: '1h' });
console.log("Token:", token);

fetch('http://localhost:5001/api/leave-requests', {
    headers: { Authorization: `Bearer ${token}` }
})
.then(res => res.json())
.then(data => console.log("Data:", JSON.stringify(data, null, 2)))
.catch(e => console.error("Error:", e));
