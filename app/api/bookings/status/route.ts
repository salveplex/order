import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

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
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check booking status' },
      { status: 500 }
    );
  }
}

async function getBookingStatusFromTaxi4U(bookingId: string) {
  // Make API call to Taxi4U to get booking status
  const response = await fetch(`${API_BASE}/api/v2/bookings/${bookingId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(
        `${API_USERNAME}:${API_PASSWORD}`
      ).toString('base64')}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: false,
        found: false,
        message: 'Booking not found',
      };
    }

    const errorData = await response.text();
    console.error('Taxi4U API error:', response.status, errorData);
    throw new Error(
      `Taxi4U API error: ${response.status} - ${errorData}`
    );
  }

  const booking = await response.json();

  // Map Taxi4U status to our status
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'assigned': 'accepted',
    'accepted': 'accepted',
    'inprogress': 'inProgress',
    'in_progress': 'inProgress',
    'completed': 'completed',
    'cancelled': 'cancelled',
  };

  return {
    success: true,
    found: true,
    bookingId: booking.id || booking.bookingId,
    bookingNumber: booking.bookingNumber,
    status: statusMap[booking.status?.toLowerCase()] || booking.status,
    vehicle: booking.vehicle?.name || booking.assignedVehicle,
    driver: booking.driver?.name || booking.driverName,
    pickupAddress: booking.pickupAddress,
    dropoffAddress: booking.dropoffAddress,
    bookingTime: booking.bookingTime,
    estimatedPrice: booking.estimatedPrice,
  };
}
