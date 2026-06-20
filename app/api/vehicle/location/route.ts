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

    // Fetch active vehicles list to find the one with this booking
    const vehicleResponse = await fetch(
      `${API_BASE}/api/vehicle?centralCode=${encodeURIComponent(centralCode)}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );

    if (!vehicleResponse.ok) {
      console.error('Vehicle API error:', vehicleResponse.status);
      return NextResponse.json(
        { error: 'Failed to fetch vehicle information' },
        { status: 500 }
      );
    }

    const vehicles = await vehicleResponse.json();

    // Find vehicle with matching activeTrip
    const vehicle = vehicles.find(
      (v: any) => v.activeTrip === bookRef
    );

    if (!vehicle) {
      // Return empty location data if vehicle not found yet
      return NextResponse.json({
        pickupLat: 60.5627, // Default to Voss
        pickupLon: 6.4227,
        destLat: 60.5637,
        destLon: 6.4189,
        driverName: null,
        licenseNo: null,
        regNo: null,
        gpsVelocity: 0,
        gpsDirection: 0,
        activeTrip: bookRef,
      });
    }

    // Return vehicle location data
    return NextResponse.json({
      pickupLat: vehicle.pickupLat || 60.5627,
      pickupLon: vehicle.pickupLon || 6.4227,
      destLat: vehicle.destLat || 60.5637,
      destLon: vehicle.destLon || 6.4189,
      driverName: vehicle.driverName,
      licenseNo: vehicle.licenseNo,
      regNo: vehicle.regNo,
      gpsVelocity: vehicle.gpsVelocity || 0,
      gpsDirection: vehicle.gpsDirection || 0,
      activeTrip: vehicle.activeTrip,
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
