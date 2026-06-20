import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

// Token cache (same as status endpoint)
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

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    console.log(`📛 Attempting to cancel booking: ${bookingId}`);

    const authToken = await getAuthToken();

    // Call Taxi4U DELETE endpoint with Bearer token and required parameters
    const params = new URLSearchParams();
    params.append('bookRef', bookingId);  // Note: singular 'bookRef' for DELETE
    params.append('centralCode', 'VS');

    const response = await fetch(`${API_BASE}/api/v2/book?${params.toString()}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();

      // 422 = Already deleted/cancelled - treat as success
      if (response.status === 422 && errorData.includes('ALLEREDE SLETTET')) {
        console.log(`✅ Booking ${bookingId} already cancelled`);
        return NextResponse.json(
          { success: true, message: 'Booking was already cancelled' },
          { status: 200 }
        );
      }

      console.error(`❌ Cancel failed for ${bookingId}:`);
      console.error('   Status:', response.status);
      console.error('   Response:', errorData);

      return NextResponse.json(
        { error: `Failed to cancel booking: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    // Taxi4U DELETE returns empty response body on success
    console.log(`✅ Booking ${bookingId} cancelled successfully`);

    return NextResponse.json(
      { success: true, message: 'Booking cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Cancel booking error:', errorMessage);
    return NextResponse.json(
      { error: `Cancel failed: ${errorMessage}`, details: errorMessage },
      { status: 500 }
    );
  }
}
