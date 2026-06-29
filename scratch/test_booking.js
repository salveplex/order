const fs = require('fs');
const envStr = fs.readFileSync('.env.local', 'utf8');
const matchUser = envStr.match(/TAXI4U_USERNAME=(.+)/);
const matchPass = envStr.match(/TAXI4U_PASSWORD=(.+)/);

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = matchUser[1].trim();
const API_PASSWORD = matchPass[1].trim();

async function run() {
  const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: API_USERNAME, password: API_PASSWORD }),
  });
  const token = (await loginResponse.json()).accessToken;

  const res = await fetch(`${API_BASE}/api/book?bookRefs=BEN343&centralCode=VS`, {
      headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await res.json();
  console.log(data);
}
run();
