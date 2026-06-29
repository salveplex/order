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
    
    console.log('🔍 Searching for specification/details endpoint...\n');
    
    const paths = [
      '/api/receiptSpecification?centralCode=VS&bookRef=BEO214',
      '/api/specification?centralCode=VS&bookRef=BEO214',
      '/api/trip/details?centralCode=VS&bookRef=BEO214',
      '/api/v2/tripDetails?centralCode=VS&bookRef=BEO214',
      '/api/receiptLines?centralCode=VS&bookRef=BEO214',
      '/api/tripLine?bookRef=BEO214&centralCode=VS',
      '/api/tariffa?bookRef=BEO214&centralCode=VS',
      '/api/taxiMeter?bookRef=BEO214&centralCode=VS'
    ];
    
    for (const path of paths) {
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 200) {
          const text = await res.text();
          if (text.length > 10) {
            console.log(`✓ ${path} - Status ${res.status}`);
            console.log(`Response: ${text.substring(0, 800)}\n`);
          }
        } else if (res.status !== 404) {
          console.log(`? ${path} - Status ${res.status}\n`);
        }
      } catch (e) {
        console.log(`✗ ${path} - ${e.message}\n`);
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
