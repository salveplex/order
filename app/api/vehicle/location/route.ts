import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

let cachedToken: { token: string; expiry: number } | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiry > Date.now()) {
    return cachedToken.token;
  }

  const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: API_USERNAME,
      password: API_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Auth login failed: ${loginResponse.status}`);
  }

  const loginResult = await loginResponse.json();
  const token = loginResult.accessToken;
  const expiryStr = loginResult.accessExpiry;
  const expiryTime = new Date(expiryStr).getTime();
  cachedToken = { token, expiry: expiryTime };

  return token;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookRef = searchParams.get('bookRef');
    const centralCode = searchParams.get('centralCode') || 'VS';

    if (!bookRef) {
      return NextResponse.json(
        { error: 'bookRef parameter is required' },
        { status: 400 }
      );
    }

    // Get auth token
    const authToken = await getAuthToken();

    // 1. Fetch booking to get exact latitude/longitude and vehicleNo
    const bookingParams = new URLSearchParams();
    bookingParams.append('bookRefs', bookRef);
    bookingParams.append('centralCode', centralCode);

    const bookingRes = await fetch(`${API_BASE}/api/v2/book?${bookingParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    let pickupLat: number | null = null;
    let pickupLon: number | null = null;
    let destLat: number | null = null;
    let destLon: number | null = null;
    let vehicleLat: number | null = null;
    let vehicleLon: number | null = null;
    let assignedVehicleNo: string | null = null;

    if (bookingRes.ok) {
      const data = await bookingRes.json();
      const booking = Array.isArray(data) ? data[0] : data;
      if (booking) {
        // 1. Pickup Coordinates
        if (booking.fromLatitude) {
          pickupLat = parseFloat(booking.fromLatitude);
        } else if (booking.pickupLat) {
          pickupLat = parseFloat(booking.pickupLat);
        } else if (booking.latitude) {
          pickupLat = parseFloat(booking.latitude);
        }
        
        if (booking.fromLongitude) {
          pickupLon = parseFloat(booking.fromLongitude);
        } else if (booking.pickupLon) {
          pickupLon = parseFloat(booking.pickupLon);
        } else if (booking.longitude) {
          pickupLon = parseFloat(booking.longitude);
        }

        // 2. Destination Coordinates
        if (booking.toLatitude) {
          destLat = parseFloat(booking.toLatitude);
        } else if (booking.destLat) {
          destLat = parseFloat(booking.destLat);
        }
        
        if (booking.toLongitude) {
          destLon = parseFloat(booking.toLongitude);
        } else if (booking.destLon) {
          destLon = parseFloat(booking.destLon);
        }

        // 3. Vehicle Coordinates
        if (booking.latitude) vehicleLat = parseFloat(booking.latitude);
        if (booking.longitude) vehicleLon = parseFloat(booking.longitude);
        if (booking.vehicleNo) assignedVehicleNo = String(booking.vehicleNo);
      }
    }

    // 2. Fetch active vehicles list to get extended details (speed, direction)
    const vehicleResponse = await fetch(
      `${API_BASE}/api/vehicle?centralCode=${encodeURIComponent(centralCode)}`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );

    if (!vehicleResponse.ok) {
      // If vehicle list fails, at least return the coordinates from the booking
      return NextResponse.json({
        pickupLat: pickupLat,
        pickupLon: pickupLon,
        destLat: destLat,
        destLon: destLon,
        vehicleLat: vehicleLat,
        vehicleLon: vehicleLon,
        activeTrip: bookRef,
        licenseNo: assignedVehicleNo,
      });
    }

    const vehicles = await vehicleResponse.json();

    // Find vehicle with matching activeTrip OR matching assignedVehicleNo
    const vehicle = vehicles.find(
      (v: any) => v.activeTrip === bookRef || (assignedVehicleNo && (String(v.licenseNo) === assignedVehicleNo || String(v.regNo) === assignedVehicleNo))
    );

    if (!vehicle) {
      // Return booking coordinates if vehicle not found in active list
      return NextResponse.json({
        pickupLat: pickupLat,
        pickupLon: pickupLon,
        pickupAddress: null,
        destLat: destLat,
        destLon: destLon,
        destAddress: null,
        vehicleLat: vehicleLat,
        vehicleLon: vehicleLon,
        driverName: null,
        activeVehicleMobile: null,
        licenseNo: assignedVehicleNo,
        regNo: null,
        gpsVelocity: 0,
        gpsDirection: 0,
        activeTrip: bookRef,
      });
    }

    // Return combined vehicle location data
    return NextResponse.json({
      pickupLat: vehicle.pickupLat || pickupLat || null,
      pickupLon: vehicle.pickupLon || pickupLon || null,
      pickupAddress: vehicle.pickupAddress || null,
      destLat: vehicle.destLat || destLat || null,
      destLon: vehicle.destLon || destLon || null,
      destAddress: vehicle.destAddress || null,
      vehicleLat: vehicle.vehicleLat || vehicleLat || null,
      vehicleLon: vehicle.vehicleLon || vehicleLon || null,
      driverName: vehicle.driverName,
      activeVehicleMobile: vehicle.activeVehicleMobile,
      licenseNo: vehicle.licenseNo || assignedVehicleNo,
      regNo: vehicle.regNo,
      gpsVelocity: vehicle.gpsVelocity || 0,
      gpsDirection: vehicle.gpsDirection || 0,
      activeTrip: vehicle.activeTrip || bookRef,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Vehicle location error:', errorMessage);
    return NextResponse.json(
      { error: `Failed to fetch vehicle location: ${errorMessage}` },
      { status: 500 }
    );
  }
}
