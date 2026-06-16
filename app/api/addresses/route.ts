import { NextRequest, NextResponse } from 'next/server';
import { VOSS_PLACES } from '@/lib/osm-places';

const searchCache = new Map<string, { results: any[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
    if (cached && cached.results.length > 0 && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for "${query}": ${cached.results.length} results`);
      return NextResponse.json({ suggestions: cached.results });
    }

    // Try Entur Geocoder v3 (best for Norwegian addresses, stations, POI)
    let suggestions = await getAddressSuggestionsFromEntur(query, lang);

    // Fallback to Kartverket if Entur fails
    if (suggestions.length === 0) {
      console.log('Entur returned no results, trying Kartverket...');
      suggestions = await getAddressSuggestionsFromKartverket(query);
    }

    // Final fallback to local favorites
    if (suggestions.length === 0) {
      console.log('Kartverket returned no results, using local favorites...');
      suggestions = getFallbackSuggestions(query, lang);
    }

    // Cache only non-empty results
    if (suggestions.length > 0) {
      searchCache.set(cacheKey, {
        results: suggestions,
        timestamp: Date.now(),
      });
    }

    console.log(`Address search for "${query}": found ${suggestions.length} results`);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

async function getAddressSuggestionsFromEntur(query: string, lang: 'no' | 'en') {
  try {
    const params = new URLSearchParams({
      q: query,
    });

    const response = await fetch(
      `https://api.entur.io/geocoder/v3/autocomplete?${params}`,
      {
        method: 'GET',
        headers: {
          'ET-Client-Name': 'vosstaxi-booking',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Entur API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
      console.log('No results from Entur');
      return [];
    }

    // Map Entur response to our format
    const suggestions = data.features.map((feature: any) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates || [0, 0];
      const address = props.address || {};

      // Get name from Entur's names object
      const name = props.names?.default || props.names?.display || props.name || '';

      // Build address from properties
      const addressParts = [];
      if (props.street && props.housenumber) {
        addressParts.push(`${props.street} ${props.housenumber}`);
      }
      if (address.locality) {
        addressParts.push(address.locality);
      }
      if (address.postCode) {
        addressParts.push(address.postCode);
      }

      return {
        name: name,
        address: addressParts.length > 0 ? addressParts.join(', ') : address.locality || name,
        lat: coords[1],
        lng: coords[0],
        type: props.layer || '',
      };
    }).filter((item: any) => item.name);

    console.log(`Entur returned ${suggestions.length} results`);
    return suggestions;
  } catch (error) {
    console.error('Error fetching from Entur:', error);
    return [];
  }
}

async function getAddressSuggestionsFromKartverket(query: string) {
  try {
    const response = await fetch(
      `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(query)}&treffPerSide=10`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('Kartverket API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.adresser || !Array.isArray(data.adresser) || data.adresser.length === 0) {
      console.log('No results from Kartverket');
      return [];
    }

    // Map Kartverket response to our format
    const suggestions = data.adresser
      .map((address: any) => {
        const fullAddress = `${address.adressebetegnelse}, ${address.postnummer} ${address.poststed}`;

        return {
          name: address.adressebetegnelse,
          address: fullAddress,
          lat: address.representasjonspunkt?.lat || 0,
          lng: address.representasjonspunkt?.lon || 0,
        };
      })
      .filter((item: any) => item.name && item.address);

    console.log(`Kartverket returned ${suggestions.length} results`);
    return suggestions;
  } catch (error) {
    console.error('Error fetching from Kartverket:', error);
    return [];
  }
}

// No fallback - use only OpenStreetMap data
// If Nominatim returns nothing, return empty array

async function getAddressSuggestionsFromNominatim(
  query: string,
  lang: 'no' | 'en' = 'no'
) {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key needed)
    // Improve search with region context
    const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
    const searchQuery = query.includes('voss') || query.includes('hordaland')
      ? `${query}, Norway`
      : `${query}, Voss, Norway`;
    searchUrl.searchParams.append('q', searchQuery);
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
  const places = VOSS_PLACES[lang] || VOSS_PLACES.no;
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
