
async function run() {
  const loginRes = await fetch('https://api.taxi4u.cab/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'voss', password: 'hpM92nDrpAaGm6K4AKUV' })
  });
  const loginData = await loginRes.json();
  const token = loginData.accessToken;

  const vehicleRes = await fetch('https://api.taxi4u.cab/api/vehicle?centralCode=VS', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const vehicles = await vehicleRes.json();
  const active = vehicles.filter(v => v.activeTrip);
  if (active.length > 0) {
    console.log(JSON.stringify(active[0], null, 2));
  } else {
    console.log(JSON.stringify(vehicles[0], null, 2));
  }
}

run();
