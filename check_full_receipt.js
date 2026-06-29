const API_BASE = 'https://api.taxi4u.cab';

async function getToken() {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'voss', password: 'hpM92nDrpAaGm6K4AKUV' })
  });
  const data = await res.json();
  return data.accessToken;
}

(async () => {
  try {
    const token = await getToken();
    
    console.log('📄 FULL RECEIPT DATA FOR BEO214:\n');
    const receiptRes = await fetch(`${API_BASE}/api/receipt?centralCode=VS&bookRef=BEO214`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const receipt = await receiptRes.json();
    console.log(JSON.stringify(receipt, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
