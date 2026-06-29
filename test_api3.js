const API_BASE = 'https://api.taxi4u.cab';
const username = 'voss';
const password = 'hpM92nDrpAaGm6K4AKUV';

(async () => {
  try {
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: username, password: password })
    });
    
    const text = await loginRes.text();
    console.log('Raw token response:');
    console.log(text);
    
    // Parse the JSON response
    const parsed = JSON.parse(text);
    console.log('\nParsed JSON:');
    console.log(JSON.stringify(parsed, null, 2));
    
    const token = parsed.accessToken;
    console.log(`\nUsing token: ${token}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
