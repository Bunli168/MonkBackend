const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({ origin: true }));
app.post('/api/auth/login', (req, res) => res.json({ok: true}));
app.listen(3009, () => console.log('listening'));
