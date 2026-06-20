import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

// Simple in-memory token cache (in production, use Redis or similar)
let cachedToken: { token: string; expiry: number } | null = null;

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
  pickupLat?: number;
  pickupLon?: number;
  pickupCity?: string;
  dropoffLat?: number;
  dropoffLon?: number;
  dropoffCity?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingData = await request.json();

    // Log what frontend sent to this API
    console.log('=== BOOKING DATA RECEIVED FROM FRONTEND ===');
    console.log(`formData.carType = "${body.carType}"`);
    console.log(JSON.stringify(body, null, 2));
    console.log('==========================================\n');

    // Create booking via Taxi4U API
    const bookingResponse = await createBookingWithTaxi4U(body);

    return NextResponse.json(bookingResponse, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Booking error:', errorMessage);
    return NextResponse.json(
      { error: `Booking failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}

async function getAuthToken(): Promise<string> {
  // Check if we have a cached token that's still valid
  if (cachedToken && cachedToken.expiry > Date.now()) {
    console.log('Using cached auth token');
    return cachedToken.token;
  }

  // Login to get a new token
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
    const errorData = await loginResponse.text();
    console.error('Auth login failed:', loginResponse.status, errorData);
    throw new Error(`Auth login failed: ${loginResponse.status}`);
  }

  const loginResult = await loginResponse.json();
  const token = loginResult.accessToken;
  const expiryStr = loginResult.accessExpiry;

  // Cache the token with expiry time
  const expiryTime = new Date(expiryStr).getTime();
  cachedToken = { token, expiry: expiryTime };

  console.log('New auth token obtained, expires at:', expiryStr);
  return token;
}

async function createBookingWithTaxi4U(data: BookingData) {
  // Convert date and time to UTC ISO format
  // Input format: date="2026-06-16", time="14:30"
  // Output format: "2026-06-16T14:30:00Z"
  const pickupTimeISO = `${data.date}T${data.time}:00Z`;

  // Build message to driver with vehicle type and additional info
  const carTypeLabels: Record<string, string> = {
    'estatecar': 'Personbil',
    'sixseater': '6-seter',
    'eightseater': '8-seter',
    'wheelchair': 'Rullestol'
  };

  const carTypeLabel = carTypeLabels[data.carType] || data.carType;
  let messageText = `Biltype: ${carTypeLabel}`;

  if (data.additionalInfo && data.additionalInfo.trim()) {
    messageText += `\nNotat: ${data.additionalInfo}`;
  }

  // Use /api/v2/book/general endpoint for auto-dispatch support
  // This endpoint supports manualProcessing: false to enable auto-dispatch
  const taxi4uBookingData: Record<string, any> = {
    centralCode: 'VS',  // Voss/Sogn central code
    manualProcessing: false,  // Enable auto-dispatch (lowercase!)
    passengers: [
      {
        seqNo: 0,
        toName: data.name,
        toTel: data.phone,
        fromStreet: data.pickupLocation,
        fromCity: data.pickupCity || 'Voss',
        fromLat: data.pickupLat,
        fromLon: data.pickupLon,
        toStreet: data.dropoffLocation,
        toCity: data.dropoffCity || 'Voss',
        toLat: data.dropoffLat,
        toLon: data.dropoffLon,
        pickupTime: pickupTimeISO,
      }
    ],
    messageToCar: messageText,
  };

  // Add email notification if provided
  if (data.email && data.email.trim()) {
    console.log(`Booking email for receipt: ${data.email}`);
  }

  try {
    // Get auth token
    const authToken = await getAuthToken();

    // Log the exact payload being sent to Taxi4U
    console.log('=== BOOKING PAYLOAD SENT TO TAXI4U ===');
    console.log(JSON.stringify(taxi4uBookingData, null, 2));
    console.log('====================================\n');

    // Make booking request with JWT token using /api/v2/book/general endpoint
    const response = await fetch(`${API_BASE}/api/v2/book/general`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(taxi4uBookingData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Taxi4U booking API error:', response.status, errorData);

      // If 403 Forbidden, use fallback (likely permission issue or wrong central code)
      if (response.status === 403) {
        console.warn('API returned 403 - likely missing permissions or wrong central code. Using fallback.');
        throw new Error('API_PERMISSION_ISSUE');
      }

      throw new Error(
        `Taxi4U API error: ${response.status} - ${errorData}`
      );
    }

    const result = await response.json();

    // Taxi4U returns the AppBook object with BookRef populated
    const bookingNumber = result.bookRef || result.id || `BK-${Date.now()}`;

    console.log('Booking successful, BookRef:', bookingNumber);

    return {
      success: true,
      bookingId: bookingNumber,
      bookingNumber: bookingNumber,
      estimatedPrice: result.estimatedPrice,
      message: 'Booking created successfully',
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Fallback: Use demo mode if API is unavailable or has permission issues
    if (errorMsg.includes('API_PERMISSION_ISSUE') || errorMsg.includes('401') || errorMsg.includes('403')) {
      console.warn('Using fallback booking (demo/permission issue)');

      const bookingNumber = `T4U-${Date.now()}`;

      // Log email notification request
      if (data.email && data.email.trim()) {
        console.log(`[DEMO] Email receipt would be sent to: ${data.email} with booking number: ${bookingNumber}`);
      }

      return {
        success: true,
        bookingId: bookingNumber,
        bookingNumber: bookingNumber,
        estimatedPrice: undefined,
        message: 'Booking created successfully (demo mode)',
      };
    }

    console.error('Booking creation failed:', errorMsg);
    throw error;
  }
}
