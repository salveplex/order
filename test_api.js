const API_BASE = 'https://api.taxi4u.cab';
const username = 'voss';
const password = 'hpM92nDrpAaGm6K4AKUV';

(async () => {
  try {
    console.log('🔓 Logging in...');
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: username, password: password })
    });
    
    const tokenData = await loginRes.text();
    const token = tokenData.replace(/['"]+/g, '');
    
    console.log(`✅ Auth OK, token: ${token.substring(0, 30)}...`);
    
    // Fetch bookings
    console.log('\n📋 Fetching bookings from Taxi4U...');
    const bookRes = await fetch(`${API_BASE}/api/v2/book?centralCode=VS&limit=15`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const bookings = await bookRes.json();
    const items = Array.isArray(bookings) ? bookings : [bookings];
    
    console.log(`\n✅ Found ${items.length} booking(s)\n`);
    
    items.slice(0, 5).forEach((b, i) => {
      console.log(`\n--- Booking ${i+1} ---`);
      console.log(`  bookRef: ${b.bookRef}`);
      console.log(`  tripStatusCode: ${b.tripStatusCode} ❌ THIS IS KEY`);
      console.log(`  vehicleNo: ${b.vehicleNo || 'none'}`);
      console.log(`  msgOut: ${b.msgOut}`);
      console.log(`  driverNo: ${b.driverNo || 'none'}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
