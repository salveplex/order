// Address autocomplete and place recognition
// Combines local database with Taxi4U API lookups

const COMMON_PLACES = {
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

export interface AddressSuggestion {
  name: string;
  address: string;
}

export async function getAddressSuggestions(
  input: string,
  language: 'no' | 'en' = 'no'
): Promise<AddressSuggestion[]> {
  if (!input || input.length < 2) {
    return [];
  }

  const searchTerm = input.toLowerCase().trim();
  const places = COMMON_PLACES[language] || COMMON_PLACES.no;

  // First, try to get suggestions from API
  try {
    const apiSuggestions = await getAddressSuggestionsFromAPI(input, language);
    if (apiSuggestions.length > 0) {
      return apiSuggestions;
    }
  } catch (error) {
    console.debug('API address lookup failed, using local database:', error);
  }

  // Fallback to local database
  const localSuggestions = places.filter(
    (place) =>
      place.name.toLowerCase().includes(searchTerm) ||
      place.address.toLowerCase().includes(searchTerm)
  );

  return localSuggestions.slice(0, 8); // Return up to 8 suggestions
}

async function getAddressSuggestionsFromAPI(
  input: string,
  language: 'no' | 'en'
): Promise<AddressSuggestion[]> {
  try {
    const response = await fetch(
      `/api/addresses?q=${encodeURIComponent(input)}&lang=${language}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.debug('Failed to fetch from API:', error);
    return [];
  }
}

export function normalizeAddress(address: string): string {
  return address.trim();
}
