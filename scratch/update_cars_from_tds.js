const fs = require('fs');

async function updateCars() {
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
    const raw = data.d;
    const entries = raw.split('#').filter(e => e.trim().length > 0);
    
    // read existing
    let carsDict = {};
    const existingContent = fs.readFileSync('lib/cars.ts', 'utf8');
    const regex = /"([^"]+)":\s*{\s*"model":\s*"([^"]+)",\s*"color":\s*"([^"]+)"\s*}/g;
    let m;
    while ((m = regex.exec(existingContent)) !== null) {
      carsDict[m[1]] = { model: m[2], color: m[3] };
    }

    const beforeCount = Object.keys(carsDict).length;

    for (const e of entries) {
        const parts = e.split(';');
        if (parts.length > 9) {
            const licenseNo = parts[4];
            let model = parts[8];
            let color = parts[9];
            if (licenseNo && model) {
                if (color === "GRAO") color = "GRÅ";
                if (color === "GRAOBRUNÅ") color = "GRÅBRUN";
                if (model === "Unknown" || color === "Unknown") {
                  if (carsDict[licenseNo]) {
                    model = carsDict[licenseNo].model;
                    color = carsDict[licenseNo].color;
                  }
                }
                carsDict[licenseNo] = { model, color };
            }
        }
    }

    let tsContent = `export const carModels: Record<string, { model: string, color: string }> = {\n`;
    for (const [license, info] of Object.entries(carsDict)) {
        tsContent += `  "${license}": { "model": "${info.model}", "color": "${info.color}" },\n`;
    }
    tsContent += `};\n\n`;
    tsContent += `export function getCarDetails(licenseNo: string) {\n`;
    tsContent += `  return carModels[licenseNo] || null;\n`;
    tsContent += `}\n`;

    fs.writeFileSync('lib/cars.ts', tsContent);
    console.log(`Merged lib/cars.ts! Before: ${beforeCount}, After: ${Object.keys(carsDict).length} cars!`);
  } catch (e) {
    console.error(e);
  }
}

updateCars();
