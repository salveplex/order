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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: API_USERNAME,
      password: API_PASSWORD,
    }),
  });

  const loginResult = await loginResponse.json();
  const token = loginResult.accessToken;

  const vehicleResponse = await fetch(`${API_BASE}/api/v2/vehicle?centralCode=VS&active=true`, {
      headers: { 'Authorization': `Bearer ${token}` },
  });
  const vehicles = await vehicleResponse.json();
  console.log(JSON.stringify(vehicles).substring(0, 500));
  if (vehicles.data) {
      console.log(vehicles.data.find(x => x.licenseNo === 'VE 2614'));
  }
}

run();
