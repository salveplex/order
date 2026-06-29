async function run() {
  try {
    const res = await fetch(`https://kart.vosstaxi.no/map-api/tds/portal/map/V12/Default.aspx/UpdateVehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            CentralCode: 'VS',
            CentralCodeFilter: '',
            OwnerNo: '',
            TripsHoursAhead: '1',
            VehicleStatusFilter: '127',
            VehiclePermitFilter: '',
            VehicleTariffFilter: ''
        })
    });
    const data = await res.json();
    console.log(JSON.stringify(data).substring(0, 500));
    if (data.d) {
        console.log(data.d.substring(0, 500));
    }
  } catch (e) {
    console.error(e);
  }
}
run();
