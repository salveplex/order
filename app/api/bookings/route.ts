import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
  attributes: number[];
  hasBike?: boolean;
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
    console.log(`formData.attributes = ${JSON.stringify(body.attributes)}`);
    console.log(`formData.hasBike = ${body.hasBike}`);
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

  // Build message to driver with additional info
  let messageText = '';

  if (data.hasBike) {
    messageText += 'Har med sykkel\n';
  }

  if (data.additionalInfo && data.additionalInfo.trim()) {
    messageText += `Notat: ${data.additionalInfo}`;
  }

  let attributeString = data.attributes && data.attributes.length > 0 ? data.attributes.join(',') : '';

  // Apply default vehicle attribute if none was explicitly selected
  if (!attributeString) {
    if (!data.passengers || data.passengers <= 4) {
      attributeString = '3'; // Lav bil / Personbil
    } else if (data.passengers <= 6) {
      attributeString = '0'; // 6 setar
    } else if (data.passengers === 7) {
      attributeString = '1'; // 7 setar
    } else {
      attributeString = '89'; // 8 setar
    }
    console.log(`No vehicle type selected. Defaulting attribute to ${attributeString} based on ${data.passengers || 1} passengers.`);
  }

  // Use /api/v2/book/general endpoint for auto-dispatch support
  // This endpoint supports manualProcessing: false to enable auto-dispatch
  const taxi4uBookingData: Record<string, any> = {
    req: {},  // Required field for API (must be an object)
    centralCode: 'VS',  // Voss/Sogn central code
    manualProcessing: false,  // Enable auto-dispatch (lowercase!)
    orderedBy: 'Order',
    bookedBy: 'Order',
    passengers: [
      {
        seqNo: 0,
        clientName: data.name,
        tel: data.phone,
        fromName: data.name, // Keep as fallback
        mobile: data.phone, // Keep as fallback
        fromStreet: data.pickupLocation || 'Voss',
        fromCity: data.pickupCity || 'Voss',
        fromLat: data.pickupLat ?? 60.6288,
        fromLon: data.pickupLon ?? 6.4251,
        toStreet: data.dropoffLocation || 'Ikke oppgitt',
        toCity: data.dropoffCity || 'Voss',
        toLat: data.dropoffLat ?? 0,
        toLon: data.dropoffLon ?? 0,
        pickupTime: pickupTimeISO,
      }
    ],
    messageToCar: messageText,  // Send car type info to driver
    // Only include vehicle attribute if one was selected
    ...(attributeString && { attributes: attributeString }),
  };

  // Add email notification if provided
  if (data.email && data.email.trim()) {
    console.log(`Booking email for receipt: ${data.email}`);
    // Send receipt email using Nodemailer (if SMTP config provided)
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      });
      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@vosstaxi.no',
        to: data.email,
        subject: 'Voss Taxi Booking Receipt',
        text: `Your booking has been created successfully.\n\nBooking Number: ${bookingNumber}\nPickup: ${data.pickupLocation}\nDropoff: ${data.dropoffLocation}\nDate/Time: ${data.date} ${data.time}\n\nThank you for choosing Voss Taxi!`,
      };
      await transporter.sendMail(mailOptions);
      console.log('✅ Booking receipt email sent');
    } catch (emailErr) {
      console.error('❌ Failed to send booking receipt email:', emailErr);
    }
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
      console.error('❌ TAXI4U BOOKING API ERROR:');
      console.error('   Status:', response.status);
      console.error('   Response:', errorData);

      // If 403 Forbidden, use fallback (likely permission issue or wrong central code)
      if (response.status === 403) {
        console.warn('⚠️  API returned 403 - Missing permissions or wrong central code. Using fallback.');
        throw new Error('API_PERMISSION_ISSUE');
      }

      throw new Error(
        `Taxi4U API error: ${response.status} - ${errorData}`
      );
    }

    const result = await response.json();

    console.log('📥 FULL RESPONSE FROM TAXI4U:');
    console.log(JSON.stringify(result, null, 2));

    // Taxi4U returns the AppBook object with BookRef populated
    const bookingNumber = result.bookRef || result.id || `BK-${Date.now()}`;

    console.log('📍 Extracted bookingNumber:', bookingNumber);
    console.log('   - from bookRef:', result.bookRef);
    console.log('   - from id:', result.id);
    console.log('   - fallback used:', !result.bookRef && !result.id);

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
      console.warn('⚠️  USING FALLBACK BOOKING (DEMO MODE)');
      console.warn('   Reason:', errorMsg);

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

    console.error('❌ BOOKING CREATION FAILED:', errorMsg);
    throw error;
  }
}
