const axios = require('axios');

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com', // guess email
      password: 'password123'
    });
    const token = loginRes.data.accessToken;
    const res = await axios.post('http://localhost:5000/api/surveys', {
      title: 'API Test',
      targetId: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
run();
