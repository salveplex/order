const fs = require('fs');

const src = 'app/track/[id]/page.tsx';
const dest = 'app/demo/page.tsx';

let content = fs.readFileSync(src, 'utf8');

// Replace standard exports and hooks
content = content.replace('export default function BookingTracking() {', 'export default function DemoTracking() {');
content = content.replace(/const \{ id \} = useParams\(\);/g, 'const id = "DEMO-1234";');
content = content.replace(/import \{ useParams \} from 'next\/navigation';/g, '');

// Replace fetchData and its interval
const oldEffect = `// Fetch booking status and vehicle location
  useEffect(() => {
    if (!bookingNumber) return;

    const fetchData = async () => {
      try {
        const [statusRes, locationRes] = await Promise.all([
          fetch(\`/api/bookings/status?id=\${encodeURIComponent(bookingNumber)}\`),
          fetch(\`/api/vehicle/location?bookRef=\${encodeURIComponent(bookingNumber)}\`),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setStatus(statusData);
        }

        if (locationRes.ok) {
          const locationData = await locationRes.json();
          setLocation(locationData);
          const L = (window as any).L;

          // First load logic - fit all points in view
          if (mapRef.current && !mapRef.current.hasSetInitialCenter) {
            const bounds = L.latLngBounds();
            let hasPoints = false;

            if (locationData.vehicleLat && locationData.vehicleLon) {
              bounds.extend([locationData.vehicleLat, locationData.vehicleLon]);
              hasPoints = true;
            }
            if (locationData.pickupLat && locationData.pickupLon) {
              bounds.extend([locationData.pickupLat, locationData.pickupLon]);
              hasPoints = true;
            }
            if (locationData.destLat && locationData.destLon) {
              bounds.extend([locationData.destLat, locationData.destLon]);
              hasPoints = true;
            }

            if (hasPoints) {
              mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
              mapRef.current.hasSetInitialCenter = true;
            }
          }

          // Draw pickup location
          if (mapRef.current && locationData.pickupLat && locationData.pickupLon) {
            updatePickupMarker(locationData.pickupLat, locationData.pickupLon);
          }

          // Draw destination location
          if (mapRef.current && locationData.destLat && locationData.destLon) {
            updateDestMarker(locationData.destLat, locationData.destLon);
          }

          // Draw vehicle marker
          if (mapRef.current && locationData.vehicleLat && locationData.vehicleLon) {
            updateVehicleMarker(
              locationData.vehicleLat,
              locationData.vehicleLon,
              locationData.gpsDirection || 0,
              locationData.licenseNo || 'Taxi'
            );
          } else if (mapRef.current && locationData.pickupLat && locationData.pickupLon && !vehicleMarkerRef.current) {
             // Fallback: center map on pickup if no vehicle location
             mapRef.current.setView([locationData.pickupLat, locationData.pickupLon], 13);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [bookingNumber]);`;

const newEffect = `// Poll for updates
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const cycleLength = 30; // Shorter cycle for demo
      const progress = (frame % cycleLength) / cycleLength; // 0 to 1
      
      const startLat = 60.659176;
      const startLon = 6.42092;
      const endLat = 60.6281914;
      const endLon = 6.4222631;
      
      const interpolatedLat = startLat + (endLat - startLat) * progress;
      const interpolatedLon = startLon + (endLon - startLon) * progress;

      const demoStatus = {
        found: true,
        status: progress < 0.5 ? 'accepted' : 'inProgress' as const,
        statusText: progress < 0.5 ? 'Sjåfør godkjend! Køyretøy er på veg' : 'Passasjer i bil! Køyrer til destinasjon',
        booking: {
          fromStreet: 'Grevlesvegen 22',
          toStreet: 'Uttrågata 19',
          latitude: '60.659176',
          longitude: '6.42092'
        }
      };
      
      const demoLocation = {
        pickupLat: startLat,
        pickupLon: startLon,
        destLat: endLat,
        destLon: endLon,
        vehicleLat: interpolatedLat,
        vehicleLon: interpolatedLon,
        pickupAddress: 'Grevlesvegen 22',
        destAddress: 'Uttrågata 19',
        regNo: 'SV 12345',
        licenseNo: '123',
        vehicleType: 'Minibus',
        gpsVelocity: 450,
        eta: Math.max(1, Math.round((1 - progress) * 10))
      };

      // Set fake ETA values for the demo
      if (demoStatus.status === 'accepted') {
        setEtaPickup(Math.max(1, Math.round((0.5 - progress) * 20)));
        setEtaDropoff(null);
      } else {
        setEtaDropoff(Math.max(1, Math.round((1 - progress) * 20)));
        setEtaPickup(null);
      }

      setStatus(demoStatus as any);
      setLocation(demoLocation as any);
      
      const L = (window as any).L;
      if (mapRef.current && L && !mapRef.current.hasSetInitialCenter) {
          const bounds = L.latLngBounds();
          bounds.extend([startLat, startLon]);
          bounds.extend([endLat, endLon]);
          mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          mapRef.current.hasSetInitialCenter = true;
      }
      
      if (mapRef.current && L) {
          updatePickupMarker(startLat, startLon);
          updateDestMarker(endLat, endLon);
          updateVehicleMarker(interpolatedLat, interpolatedLon, 0, 'Taxi');
      }

      setLoading(false);
    }, 1000); // Update every 1 second

    return () => clearInterval(interval);
  }, []);`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync(dest, content, 'utf8');
console.log('Demo page rewritten from actual page!');
