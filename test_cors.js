const cors = require('cors');
const req = { headers: { origin: 'https://neakavorn-pagoda.netlify.app' } };
const res = { setHeader: (k,v) => console.log(k, v) };
cors({ origin: (o, cb) => cb(null, ['http://localhost:5173', 'https://neakavorn-pagoda.netlify.app']) })(req, res, () => console.log('next'));
