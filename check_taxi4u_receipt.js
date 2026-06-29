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
    
    console.log('🔍 Trying different receipt endpoints...\n');
    
    // Try different endpoints
    const endpoints = [
      '/api/receipt?centralCode=VS&bookRef=BEO214',
      '/api/v2/receipt?centralCode=VS&bookRef=BEO214',
      '/api/receiptHtml?centralCode=VS&bookRef=BEO214',
      '/api/receiptPdf?centralCode=VS&bookRef=BEO214'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const text = await res.text();
        console.log(`✓ ${endpoint}`);
        console.log(`  Status: ${res.status}`);
        console.log(`  Response length: ${text.length}`);
        console.log(`  First 500 chars: ${text.substring(0, 500)}\n`);
      } catch (e) {
        console.log(`✗ ${endpoint} - ${e.message}\n`);
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
