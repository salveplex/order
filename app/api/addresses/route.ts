import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://api.taxi4u.cab';
const API_USERNAME = process.env.TAXI4U_USERNAME || '';
const API_PASSWORD = process.env.TAXI4U_PASSWORD || '';

// Local address database as fallback
const LOCAL_ADDRESSES = {
  no: [
    { name: 'Voss Stasjon', address: 'Jernbaneplass 1, 5700 Voss' },
    { name: 'Voss Sjukehus', address: 'Haugastøl, 5700 Voss' },
    { name: 'Voss Sentrum', address: 'Evangersvingen, 5700 Voss' },
    { name: 'Voss Lufthavn', address: 'Botnelva, 5700 Voss' },
    { name: 'Voss Hotell', address: 'Utenesgt. 6, 5700 Voss' },
    { name: 'Voss Kino', address: 'Vossevangen, 5700 Voss' },
    { name: 'Oppheim Stasjon', address: 'Oppheim, 5700 Voss' },
    { name: 'Voss Bibliotek', address: 'Utenesgt. 8, 5700 Voss' },
    { name: 'Voss Rådhus', address: 'Evenstad, 5700 Voss' },
    { name: 'Fleischer\'s Hotel', address: 'Evangersvingen 21, 5700 Voss' },
    { name: 'Voss Skisenter', address: 'Myrkammen, 5700 Voss' },
    { name: 'Tøyen Park', address: 'Tøyen, 5700 Voss' },
  ],
  en: [
    { name: 'Voss Station', address: 'Jernbaneplass 1, 5700 Voss' },
    { name: 'Voss Hospital', address: 'Haugastøl, 5700 Voss' },
    { name: 'Voss City Center', address: 'Evangersvingen, 5700 Voss' },
    { name: 'Voss Airport', address: 'Botnelva, 5700 Voss' },
    { name: 'Voss Hotel', address: 'Utenesgt. 6, 5700 Voss' },
    { name: 'Voss Cinema', address: 'Vossevangen, 5700 Voss' },
    { name: 'Oppheim Station', address: 'Oppheim, 5700 Voss' },
    { name: 'Voss Library', address: 'Utenesgt. 8, 5700 Voss' },
    { name: 'Voss City Hall', address: 'Evenstad, 5700 Voss' },
    { name: 'Fleischer\'s Hotel', address: 'Evangersvingen 21, 5700 Voss' },
    { name: 'Voss Ski Center', address: 'Myrkammen, 5700 Voss' },
    { name: 'Tøyen Park', address: 'Tøyen, 5700 Voss' },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const lang = (searchParams.get('lang') || 'no') as 'no' | 'en';

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Try API first, fall back to local database
    const suggestions =
      (await getAddressSuggestionsFromTaxi4U(query)) ||
      getAddressSuggestionsFromLocal(query, lang);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Address lookup error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

async function getAddressSuggestionsFromTaxi4U(query: string) {
  try {
    // Try multiple possible Taxi4U API endpoints
    const endpoints = [
      `${API_BASE}/api/v2/addresses/search?query=${encodeURIComponent(query)}`,
      `${API_BASE}/api/addresses/search?query=${encodeURIComponent(query)}`,
      `${API_BASE}/api/v2/bookings/addresses?search=${encodeURIComponent(query)}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(
              `${API_USERNAME}:${API_PASSWORD}`
            ).toString('base64')}`,
          },
        });

        if (!response.ok) {
          continue;
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

        if (data.suggestions && Array.isArray(data.suggestions)) {
          return data.suggestions.map((item: any) => ({
            name: item.name || item.address,
            address: item.fullAddress || item.address,
            lat: item.latitude,
            lng: item.longitude,
          }));
        }
      } catch (endpointError) {
        console.debug(`Failed to fetch from ${endpoint}:`, endpointError);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching address suggestions from Taxi4U:', error);
    return null;
  }
}

function getAddressSuggestionsFromLocal(query: string, lang: 'no' | 'en') {
  const addresses = LOCAL_ADDRESSES[lang] || LOCAL_ADDRESSES.no;
  const searchTerm = query.toLowerCase().trim();

  const filtered = addresses.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.address.toLowerCase().includes(searchTerm)
  );

  return filtered.slice(0, 8); // Return up to 8 suggestions
}
