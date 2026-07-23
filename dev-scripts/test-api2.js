async function run() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sombathveurn01@gmail.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log("Login:", loginData);
    
    if (loginData.accessToken) {
      const token = loginData.accessToken;
      const res = await fetch('http://localhost:5000/api/surveys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ title: 'API Test', targetId: 1 })
      });
      const data = await res.json();
      console.log("Create:", data);
    }
  } catch(e) {
    console.log(e);
  }
}
run();
