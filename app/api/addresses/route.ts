import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const lang = searchParams.get('lang') || 'no';

    if (!query || query.length < 2) {
      return NextResponse.json(
        { suggestions: [] }
      );
    }

    const suggestions = await getAddressSuggestionsFromTaxi4U(query);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json(
      { suggestions: [] }
    );
  }
}

async function getAddressSuggestionsFromTaxi4U(query: string) {
  try {
    // Make API call to Taxi4U for address lookup
    const response = await fetch(
      `${API_BASE}/api/v2/addresses/search?query=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(
            `${API_USERNAME}:${API_PASSWORD}`
          ).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Taxi4U API error:', response.status);
      return [];
    }

    const data = await response.json();

    // Map API response to our format
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        name: item.name || item.address,
        address: item.fullAddress || item.address,
        lat: item.latitude,
        lng: item.longitude,
      }));
    }

    if (data.results && Array.isArray(data.results)) {
      return data.results.map((item: any) => ({
        name: item.name || item.address,
        address: item.fullAddress || item.address,
        lat: item.latitude,
        lng: item.longitude,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return [];
  }
}
