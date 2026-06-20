async function getTokens() {
  const loginResponse = await fetch('https://api.taxi4u.cab/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: process.env.TAXI4U_USERNAME,
      password: process.env.TAXI4U_PASSWORD
    })
  });
  const loginResult = await loginResponse.json();
  const token = loginResult.accessToken;

  const r = await fetch('https://api.taxi4u.cab/api/attribute?centralCode=VS', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log(r.status);
  if (r.status === 200) {
      const data = await r.json();
      console.log(JSON.stringify(data, null, 2));
  }
}

getTokens();
