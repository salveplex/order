import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

interface BookingData {
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  passengers: number;
  carType: string;
  name: string;
  phone: string;
  email: string;
  additionalInfo: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingData = await request.json();

    // Create booking via Taxi4U API
    const bookingResponse = await createBookingWithTaxi4U(body);

    return NextResponse.json(bookingResponse, { status: 201 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

async function createBookingWithTaxi4U(data: BookingData) {
  // Prepare booking data for Taxi4U API
  const [bookingDate, bookingTime] = [data.date, data.time];

  // Map our car types to Taxi4U car types
  const carTypeMap: Record<string, string> = {
    'estatecar': 'Standard',
    'sixseater': '6Seater',
    'eightseater': '8Seater',
    'wheelchair': 'Wheelchair',
  };

  const taxi4uBookingData = {
    customerName: data.name,
    customerPhone: data.phone,
    customerEmail: data.email,
    pickupAddress: data.pickupLocation,
    dropoffAddress: data.dropoffLocation,
    bookingDate: bookingDate,
    bookingTime: bookingTime,
    numberOfPassengers: data.passengers,
    vehicleType: carTypeMap[data.carType] || 'Standard',
    specialRequests: data.additionalInfo,
    source: 'WebBooking',
  };

  // Make API call to Taxi4U
  const response = await fetch(`${API_BASE}/api/v2/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(
        `${API_USERNAME}:${API_PASSWORD}`
      ).toString('base64')}`,
    },
    body: JSON.stringify(taxi4uBookingData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Taxi4U API error:', response.status, errorData);
    throw new Error(
      `Taxi4U API error: ${response.status} - ${errorData}`
    );
  }

  const result = await response.json();

  return {
    success: true,
    bookingId: result.bookingId || result.id,
    bookingNumber: result.bookingNumber || `BK-${Date.now()}`,
    estimatedPrice: result.estimatedPrice,
    message: 'Booking created successfully',
  };
}
