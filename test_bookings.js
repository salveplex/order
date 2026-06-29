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
    console.log('✅ Got token\n');
    
    // Fetch bookings
    console.log('📋 BOOKINGS:');
    const bookRes = await fetch(`${API_BASE}/api/v2/book?centralCode=VS&limit=20`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const bookings = await bookRes.json();
    const items = Array.isArray(bookings) ? bookings : [bookings];
    
    items.forEach((b, i) => {
      console.log(`\n${i+1}. ${b.bookRef}`);
      console.log(`   tripStatusCode: ${b.tripStatusCode}`);
      console.log(`   vehicleNo: ${b.vehicleNo || '(none)'}`);
      console.log(`   driverNo: ${b.driverNo || '(none)'}`);
      console.log(`   msgOut: "${b.msgOut}"`);
    });
    
    // Fetch vehicles
    console.log('\n\n🚗 VEHICLES:');
    const vehicRes = await fetch(`${API_BASE}/api/vehicle?centralCode=VS`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const vehicles = await vehicRes.json();
    vehicles.slice(0, 5).forEach((v, i) => {
      console.log(`\n${i+1}. ${v.licenseNo || v.regNo}`);
      console.log(`   activeTrip: ${v.activeTrip || '(none)'}`);
      console.log(`   lat/lon: ${v.latitude}, ${v.longitude}`);
      console.log(`   velocity: ${v.gpsVelocity}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
