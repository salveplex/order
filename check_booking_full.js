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
    
    console.log('📋 FULL BOOKING DATA FOR BEO214:\n');
    const bookRes = await fetch(`${API_BASE}/api/v2/book?bookRefs=BEO214&centralCode=VS`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const bookings = await bookRes.json();
    const booking = Array.isArray(bookings) ? bookings[0] : bookings;
    console.log(JSON.stringify(booking, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
