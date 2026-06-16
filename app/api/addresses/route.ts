import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const lang = (searchParams.get('lang') || 'no') as 'no' | 'en';

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Use OpenStreetMap Nominatim for address lookup
    const suggestions = await getAddressSuggestionsFromNominatim(query);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

async function getAddressSuggestionsFromNominatim(query: string) {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key needed)
    // Limit search to Norway by adding country code
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `countrycodes=no&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=8`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Taxi4U-Booking-App/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Map Nominatim response to our format
    return data
      .map((item: any) => {
        const displayName = item.display_name || '';
        const address = displayName.split(',').slice(0, 3).join(',').trim();

        // Extract place name (first part of display name)
        const parts = displayName.split(',');
        const name = parts[0]?.trim() || '';

        return {
          name: name || address,
          address: address,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      })
      .filter((item) => item.address.length > 0)
      .slice(0, 8);
  } catch (error) {
    console.error('Error fetching from Nominatim:', error);
    return [];
  }
}
