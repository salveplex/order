import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

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

    // Use Basic auth for cancellation
    const authHeader = `Basic ${Buffer.from(
      `${API_USERNAME}:${API_PASSWORD}`
    ).toString('base64')}`;

    // Call Taxi4U DELETE endpoint to cancel booking
    const response = await fetch(`${API_BASE}/api/v2/book?id=${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Cancel failed for ${bookingId}:`, response.status, errorData);

      return NextResponse.json(
        { error: `Failed to cancel booking: ${response.status}` },
        { status: response.status }
      );
    }

    console.log(`✅ Booking ${bookingId} cancelled successfully`);

    return NextResponse.json(
      { success: true, message: 'Booking cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Cancel booking error:', errorMessage);
    return NextResponse.json(
      { error: `Cancel failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
