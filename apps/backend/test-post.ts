async function main() {
  try {
    const loginRes = await fetch('http://127.0.0.1:3333/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@waycon.fr', password: 'password123' })
    });
    
    const loginData = await loginRes.json();
    console.log("Login Data:", loginData);
    const token = loginData.access_token || loginData.token || loginData.accessToken;
    if (!token) return console.log("No token!");
    console.log("Got token:", token.substring(0, 20) + '...');
    
    const createRes = await fetch('http://127.0.0.1:3333/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Test User HTTP",
        email: "test_http_" + Date.now() + "@test.com",
        password: "password123",
        role: "TECHNICIEN",
        companyId: "",
        tenantAccess: []
      })
    });
    
    console.log("Create Success:", createRes.status, await createRes.text());
  } catch (err: any) {
    console.error("HTTP Error:", err);
  }
}

main();
