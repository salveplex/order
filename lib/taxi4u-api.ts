// Taxi4U API Integration via Next.js API routes

export interface BookingRequest {
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
}

export interface BookingResponse {
  success: boolean;
  bookingId: string;
  bookingNumber: string;
  estimatedPrice?: number;
  message: string;
}

export interface AddressSuggestion {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export async function createBooking(data: BookingRequest): Promise<BookingResponse> {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create booking:', error);
    throw error;
  }
}

export async function getAddressSuggestions(
  query: string,
  language: 'no' | 'en' = 'no'
): Promise<AddressSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/addresses?q=${encodeURIComponent(query)}&lang=${language}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Failed to get address suggestions:', error);
    return [];
  }
}

export async function getBookingStatus(bookingId: string) {
  try {
    const response = await fetch(`/api/bookings/status?id=${encodeURIComponent(bookingId)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check booking status');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get booking status:', error);
    throw error;
  }
}
