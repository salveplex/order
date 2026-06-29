import pkg from '@next/env';
pkg.loadEnvConfig(process.cwd());

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

async function getAuthToken() {
  const response = await fetch(API_BASE + '/api/v2/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: API_USERNAME, password: API_PASSWORD }),
  });
  const data = await response.json();
  return data.token;
}

async function run() {
  const token = await getAuthToken();
  const res = await fetch(API_BASE + '/api/v2/book?centralCode=VS&bookRefs=BEO842,BEO832', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}

run();
