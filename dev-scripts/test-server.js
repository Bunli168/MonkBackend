const axios = require('axios');
async function test() {
  try {
    const res = await axios.put('http://localhost:3006/api/auth/profile', {
      name: "Test Name", bio: "bio", phone: "123", gender: "MALE", dateOfBirth: "2000-01-01"
    }, {
      headers: {
        Authorization: 'Bearer ' // wait we need a token
      }
    });
    console.log(res.data);
  } catch(e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
