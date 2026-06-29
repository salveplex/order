const API_BASE = 'https://api.taxi4u.cab';
const nodemailer = require('nodemailer');

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
    console.log('🔍 Fetching BEO214 data from Taxi4U...');
    const token = await getToken();
    
    // Fetch booking data
    const bookRes = await fetch(`${API_BASE}/api/v2/book?bookRefs=BEO214&centralCode=VS`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const bookings = await bookRes.json();
    const booking = Array.isArray(bookings) ? bookings[0] : bookings;
    
    console.log('📋 Booking data:');
    console.log(JSON.stringify(booking, null, 2).substring(0, 500));
    
    // Try to fetch receipt data
    console.log('\n📄 Attempting to fetch receipt from Taxi4U...');
    const receiptRes = await fetch(`${API_BASE}/api/receipt?centralCode=VS&bookRef=BEO214`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (receiptRes.ok) {
      const receipt = await receiptRes.json();
      console.log('✅ Receipt found!');
      console.log(JSON.stringify(receipt, null, 2).substring(0, 800));
    } else {
      console.log(`Receipt not ready yet (${receiptRes.status})`);
      console.log('Creating mock receipt data...');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
