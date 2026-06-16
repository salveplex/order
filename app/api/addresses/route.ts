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
    const suggestions = await getAddressSuggestionsFromNominatim(query, lang);

    console.log(`Address search for "${query}": found ${suggestions.length} results`);
    if (suggestions.length > 0) {
      console.log('First result:', suggestions[0]);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

async function getAddressSuggestionsFromNominatim(
  query: string,
  lang: 'no' | 'en' = 'no'
) {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key needed)
    // Limit search to Hordaland/Voss area and Norway
    const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('countrycodes', 'no');
    searchUrl.searchParams.append('format', 'json');
    searchUrl.searchParams.append('addressdetails', '1');
    searchUrl.searchParams.append('limit', '10');
    searchUrl.searchParams.append('accept-language', lang === 'no' ? 'no' : 'en');

    console.log('Fetching from Nominatim:', searchUrl.toString());

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Taxi4U-Booking-App/1.0',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('Nominatim raw response:', data);

    if (!Array.isArray(data) || data.length === 0) {
      console.log('No results from Nominatim');
      return [];
    }

    // Map Nominatim response to our format
    const suggestions = data
      .map((item: any) => {
        const displayName = item.display_name || '';
        const parts = displayName.split(',').map((p: string) => p.trim());

        // Get address without the country
        const address = parts.slice(0, -1).join(', ');
        const name = parts[0] || '';

        return {
          name,
          address: address || displayName,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      })
      .filter(
        (item) =>
          item.address.length > 0 && item.name.length > 0
      )
      .slice(0, 8);

    console.log('Processed suggestions:', suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error fetching from Nominatim:', error);
    return [];
  }
}
