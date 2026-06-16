import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache for address searches
// Cache key: query, value: { results, timestamp }
const searchCache = new Map<
  string,
  { results: any[]; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MIN_REQUEST_DELAY = 1000; // 1 second minimum between requests to same query

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const lang = (searchParams.get('lang') || 'no') as 'no' | 'en';

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Check cache first
    const cacheKey = `${query.toLowerCase()}:${lang}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for "${query}": ${cached.results.length} results`);
      return NextResponse.json({ suggestions: cached.results });
    }

    // Use OpenStreetMap Nominatim for address lookup
    const suggestions = await getAddressSuggestionsFromNominatim(query, lang);

    // Cache the results
    searchCache.set(cacheKey, {
      results: suggestions,
      timestamp: Date.now(),
    });

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

// Fallback list of common places in Voss
const COMMON_PLACES = {
  no: [
    { name: 'Voss Stasjon', address: 'Jernbaneplass 1, 5700 Voss' },
    { name: 'Voss Sjukehus', address: 'Haugastøl, 5700 Voss' },
    { name: 'Voss Sentrum', address: 'Evangersvingen, 5700 Voss' },
    { name: 'Voss Lufthavn', address: 'Botnelva, 5700 Voss' },
    { name: 'Oppheim Stasjon', address: 'Oppheim, 5700 Voss' },
    { name: 'Voss Hotell', address: 'Utenesgt. 6, 5700 Voss' },
  ],
  en: [
    { name: 'Voss Station', address: 'Jernbaneplass 1, 5700 Voss' },
    { name: 'Voss Hospital', address: 'Haugastøl, 5700 Voss' },
    { name: 'Voss City Center', address: 'Evangersvingen, 5700 Voss' },
    { name: 'Voss Airport', address: 'Botnelva, 5700 Voss' },
    { name: 'Oppheim Station', address: 'Oppheim, 5700 Voss' },
    { name: 'Voss Hotel', address: 'Utenesgt. 6, 5700 Voss' },
  ],
};

async function getAddressSuggestionsFromNominatim(
  query: string,
  lang: 'no' | 'en' = 'no'
) {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key needed)
    // Limit search to Norway
    const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
    searchUrl.searchParams.append('q', `${query}, Hordaland, Norway`);
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
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.status === 429) {
      console.warn('Nominatim rate limited (429), using fallback');
      return getFallbackSuggestions(query, lang);
    }

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return getFallbackSuggestions(query, lang);
    }

    const data = await response.json();
    console.log(`Nominatim returned ${Array.isArray(data) ? data.length : 0} results`);

    if (!Array.isArray(data) || data.length === 0) {
      console.log('No results from Nominatim, using fallback');
      return getFallbackSuggestions(query, lang);
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
    return getFallbackSuggestions(query, lang);
  }
}

function getFallbackSuggestions(query: string, lang: 'no' | 'en'): any[] {
  const places = COMMON_PLACES[lang] || COMMON_PLACES.no;
  const searchTerm = query.toLowerCase().trim();

  console.log(`Using fallback suggestions for "${query}"`);

  return places
    .filter(
      (place) =>
        place.name.toLowerCase().includes(searchTerm) ||
        place.address.toLowerCase().includes(searchTerm)
    )
    .slice(0, 8);
}
