


async function test() {
  try {
    const loginRes = await fetch('https://api.taxi4u.cab/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: process.env.TAXI4U_USERNAME, password: process.env.TAXI4U_PASSWORD })
    });
    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    const vehiclesRes = await fetch('https://api.taxi4u.cab/api/vehicle?centralCode=VS', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const vehicles = await vehiclesRes.json();
    
    // Find vehicles with active trips
    console.log("All vehicles status:", vehicles.map(v => ({ regNo: v.regNo, status: v.status, activeTrip: v.activeTrip })).slice(0, 10));

    if (activeVehicles.length > 0) {
        for (let v of activeVehicles.slice(0, 3)) {
            const bookRes = await fetch(`https://api.taxi4u.cab/api/v2/book?bookRefs=${v.activeTrip}&centralCode=VS`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const books = await bookRes.json();
            console.log(`Booking ${v.activeTrip} details:`);
            console.log(JSON.stringify(books, null, 2));
        }
    } else {
        console.log("No active trips found in vehicle list.");
    }

  } catch (err) {
    console.error(err);
  }
}
test();
