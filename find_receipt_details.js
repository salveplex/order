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
    
    console.log('🔍 Looking for receipt details with specification lines...\n');
    
    // Try with different parameters
    const urls = [
      '/api/receipt?centralCode=VS&bookRef=BEO214&detailed=true',
      '/api/receipt?centralCode=VS&bookRef=BEO214&format=full',
      '/api/v2/receipt?centralCode=VS&bookRef=BEO214&detailed=true',
      '/api/receiptDetails?centralCode=VS&bookRef=BEO214',
      '/api/v2/book?bookRefs=BEO214&centralCode=VS&detailed=true'
    ];
    
    for (const urlPath of urls) {
      try {
        const res = await fetch(`${API_BASE}${urlPath}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 200) {
          const data = await res.json();
          console.log(`✓ ${urlPath}`);
          console.log(JSON.stringify(data, null, 2).substring(0, 1500));
          console.log('\n---\n');
        }
      } catch (e) {}
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
