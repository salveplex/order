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
    
    const bookings = ['BEO214', 'BEO155', 'BEO185'];
    
    console.log('🔍 CHECKING BOOKING STATUSES:\n');
    
    for (const bookRef of bookings) {
      const res = await fetch(`${API_BASE}/api/v2/book?bookRefs=${bookRef}&centralCode=VS`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      const booking = Array.isArray(data) ? data[0] : data;
      
      if (booking) {
        console.log(`📌 ${bookRef}:`);
        console.log(`   tripStatusCode: ${booking.tripStatusCode}`);
        console.log(`   vehicleNo: ${booking.vehicleNo || 'none'}`);
        console.log(`   driverNo: ${booking.driverNo || 'none'}`);
        console.log(`   driverName: ${booking.driverName || 'none'}`);
        console.log(`   msgOut: "${booking.msgOut}"`);
        console.log(`   status: ${booking.status || 'none'}`);
        console.log(`   startDateTime: ${booking.startDateTime || 'none'}`);
        console.log('');
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
