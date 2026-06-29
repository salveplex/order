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
    
    console.log('🔍 Looking for trip matching PDF example (1847,00 kr, 25-06-2026)...\n');
    
    // Try to get recent receipts or bookings
    const res = await fetch(`${API_BASE}/api/v2/book?centralCode=VS&limit=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const bookings = await res.json();
    console.log(`Found ${Array.isArray(bookings) ? bookings.length : 1} bookings\n`);
    
    // Try to fetch receipts for each booking
    if (Array.isArray(bookings)) {
      for (const booking of bookings.slice(0, 10)) {
        try {
          const receiptRes = await fetch(`${API_BASE}/api/receipt?centralCode=VS&bookRef=${booking.bookingRef}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const receipt = await receiptRes.json();
          
          // Check if total matches 1847 or 184700 (cents)
          if (receipt.total === 1847 || receipt.total === 184700) {
            console.log(`✓ FOUND MATCHING TRIP: ${booking.bookingRef}`);
            console.log(JSON.stringify(receipt, null, 2));
          }
        } catch (e) {}
      }
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
