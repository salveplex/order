const fs = require('fs');

const src = 'app/track/[id]/page.tsx';
const dest = 'app/demo/page.tsx';

let content = fs.readFileSync(src, 'utf8');

// Replace standard exports and hooks
content = content.replace('export default function BookingTracking() {', 'export default function DemoTracking() {');
content = content.replace(/const \{ id \} = useParams\(\);/g, 'const id = "DEMO-1234";');
content = content.replace(/import \{ useParams \} from 'next\/navigation';/g, '');

// Replace fetchData implementation to be a simulated one
const fetchDataRegex = /const fetchData = async \(\) => \{[\s\S]*?\n  \};/g;
const newFetchData = `const fetchData = async () => {
    // Simulated demo data
    try {
      const demoStatus = {
        status: 'accepted',
        statusText: 'Sjåfør godkjend! Køyretøy er på veg',
        booking: {
          fromStreet: 'Grevlesvegen 22',
          toStreet: 'Uttrågata 19',
          latitude: '60.659176',
          longitude: '6.42092'
        }
      };
      
      const demoLocation = {
        pickupLat: 60.659176,
        pickupLon: 6.42092,
        destLat: 60.6281914,
        destLon: 6.4222631,
        vehicleLat: 60.650000 + (Math.random() * 0.001 - 0.0005),
        vehicleLon: 6.420000 + (Math.random() * 0.001 - 0.0005),
        pickupAddress: 'Grevlesvegen 22',
        destAddress: 'Uttrågata 19',
        regNo: 'SV 12345',
        licenseNo: '123',
        vehicleType: 'Minibus',
        gpsVelocity: 450,
        eta: 5
      };

      // Update state
      setStatus(demoStatus);
      setLocation(demoLocation);

      if (demoStatus.status === 'completed' || demoStatus.status === 'cancelled') {
        setIsActive(false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching simulated demo data:', error);
      setLoading(false);
    }
  };`;

content = content.replace(fetchDataRegex, newFetchData);

fs.writeFileSync(dest, content, 'utf8');
console.log('Demo page rewritten');
