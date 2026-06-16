// Address autocomplete and place recognition
// In production, this would integrate with Google Maps API or similar

const COMMON_PLACES = {
  no: [
    { name: 'Voss Stasjon', address: 'Jernbaneplass 1, 5700 Voss' },
    { name: 'Voss Sjukehus', address: 'Haugastøl, 5700 Voss' },
    { name: 'Voss Sentrum', address: 'Evangersvingen, 5700 Voss' },
    { name: 'Voss Lufthavn', address: 'Botnelva, 5700 Voss' },
    { name: 'Voss Hotell', address: 'Utenesgt. 6, 5700 Voss' },
    { name: 'Oppheim Stasjon', address: 'Oppheim, 5700 Voss' },
  ],
  en: [
    { name: 'Voss Station', address: 'Jernbaneplass 1, 5700 Voss' },
    { name: 'Voss Hospital', address: 'Haugastøl, 5700 Voss' },
    { name: 'Voss City Center', address: 'Evangersvingen, 5700 Voss' },
    { name: 'Voss Airport', address: 'Botnelva, 5700 Voss' },
    { name: 'Voss Hotel', address: 'Utenesgt. 6, 5700 Voss' },
    { name: 'Oppheim Station', address: 'Oppheim, 5700 Voss' },
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

  const places = COMMON_PLACES[language] || COMMON_PLACES.no;
  const searchTerm = input.toLowerCase().trim();

  // Filter places that match the search term
  const suggestions = places.filter(
    (place) =>
      place.name.toLowerCase().includes(searchTerm) ||
      place.address.toLowerCase().includes(searchTerm)
  );

  // If no exact matches, return all places (for demo)
  if (suggestions.length === 0) {
    return places.slice(0, 5);
  }

  return suggestions;
}

export function normalizeAddress(address: string): string {
  return address.trim();
}
