import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

// Simple token cache
let cachedToken: { token: string; expiry: number } | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiry > Date.now()) {
    return cachedToken.token;
  }

  const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: API_USERNAME,
      password: API_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Auth failed: ${loginResponse.status}`);
  }

  const result = await loginResponse.json();
  const expiryTime = new Date(result.accessExpiry).getTime();
  cachedToken = { token: result.accessToken, expiry: expiryTime };
  return result.accessToken;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const statusResponse = await getBookingStatusFromTaxi4U(bookingId);

    return NextResponse.json(statusResponse);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Status check error:', msg);
    return NextResponse.json(
      { error: 'Failed to check booking status', details: msg },
      { status: 500 }
    );
  }
}

async function getBookingStatusFromTaxi4U(bookingId: string) {
  const authToken = await getAuthToken();

  // Taxi4U requires bookRefs and centralCode parameters
  const params = new URLSearchParams();
  params.append('bookRefs', bookingId);
  params.append('centralCode', 'VS'); // Voss/Sogn

  const response = await fetch(`${API_BASE}/api/v2/book?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`❌ Taxi4U API error for ${bookingId}:`, response.status, errorData);

    if (response.status === 404) {
      console.error(`   📌 404 Booking not found - bookingId might be wrong or not synced yet`);
      return {
        success: false,
        found: false,
        message: 'Booking not found',
      };
    }

    throw new Error(
      `Taxi4U API error: ${response.status} - ${errorData}`
    );
  }

  const data = await response.json();

  console.log(`📥 Raw Taxi4U response:`, JSON.stringify(data, null, 2));

  // Handle array response from Taxi4U
  let booking = data;
  if (Array.isArray(data)) {
    console.log(`   Received array with ${data.length} items`);
    if (data.length === 0) {
      return {
        success: false,
        found: false,
        message: 'Booking not found (empty array)',
      };
    }
    booking = data[0]; // Use first item
  }

  console.log(`✅ Parsed booking data:`, JSON.stringify(booking, null, 2));
  console.log(`   - id: ${booking.id}`);
  console.log(`   - bookingId: ${booking.bookingId}`);
  console.log(`   - bookRef: ${booking.bookRef}`);
  console.log(`   - status: ${booking.status}`);

  const tripStatus = booking.tripStatusCode;
  const msgOut = (booking.msgOut || '').toUpperCase();

  let genericStatus = 'pending';
  let statusLetter = 'D'; // Default

  // Map based on tripStatusCode and msgOut patterns from Taxi4U
  // tripStatusCode 0 = "Tur på vent" - bil assigned but driver hasn't accepted yet
  // tripStatusCode 2 = "Passasjer i bil" - driver accepted, passenger on board
  // tripStatusCode 3 = "Avsluttet" - trip completed

  if (booking.tripStatusCode === 3 || msgOut.includes('AVSLUTTET') || msgOut.includes('FULLFØRT') || msgOut.includes('LEVERT')) {
    // Trip completed
    genericStatus = 'completed';
    statusLetter = 'l';
  }
  else if (booking.tripStatusCode === 2 || msgOut.includes('POB') || msgOut.includes('OPPTATT') || msgOut.includes('I BIL')) {
    // Passenger on board - actively driving
    genericStatus = 'inProgress';
    statusLetter = 'P';
  }
  else if (booking.tripStatusCode === 1 || msgOut.includes('GODKJENT') || msgOut.includes('AKSEPTERT') || msgOut.includes('ANKOMMET')) {
    // Driver accepted the booking - car is on the way to pickup
    genericStatus = 'accepted';
    statusLetter = 'I';
  }
  else if (booking.tripStatusCode === 0 || msgOut.includes('TUR PÅ VENT') || msgOut.includes('TILDELT')) {
    // Car assigned but driver hasn't accepted yet (waiting for driver to accept on meter)
    genericStatus = 'assigned';
    statusLetter = 'A';
  }

  return {
    success: true,
    found: true,
    bookingId: booking.bookingRef,
    bookingNumber: booking.bookingRef,
    status: genericStatus, // Dynamic status
    statusCode: statusLetter, // Letter code for cancellation check
    vehicle: booking.vehicleNo ? `${booking.vehicleNo}` : undefined,
    driver: booking.driverNo ? `${booking.driverNo}` : undefined,
    driverName: booking.driverName ? `${booking.driverName}` : undefined,
    tripStatusCode: tripStatus, // Numeric code from Taxi4U
    message: booking.msgOut,
  };
}
