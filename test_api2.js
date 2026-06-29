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
    console.log(`✅ Auth OK`);
    
    // Try vehicle list first
    console.log('\n🚗 Fetching vehicles...');
    const vehicleRes = await fetch(`${API_BASE}/api/vehicle?centralCode=VS`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Status: ${vehicleRes.status}`);
    const vehicleText = await vehicleRes.text();
    console.log(`Response length: ${vehicleText.length}`);
    console.log(`First 300 chars: ${vehicleText.substring(0, 300)}`);
    
    try {
      const vehicles = JSON.parse(vehicleText);
      console.log(`✅ Parsed ${vehicles.length || 'N/A'} vehicles`);
      if (Array.isArray(vehicles) && vehicles.length > 0) {
        console.log(`First vehicle:`, JSON.stringify(vehicles[0], null, 2).substring(0, 500));
      }
    } catch(e) {
      console.log('❌ Not JSON:', e.message);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
