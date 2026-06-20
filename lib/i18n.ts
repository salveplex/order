// Internationalization support for Norwegian and English

export type Language = 'no' | 'en';

export const translations = {
  no: {
    // Page title
    pageTitle: 'Bestill Taxi',

    // Header
    bookYourRide: 'Bestill Din Tur',
    subtitle: 'Rask, pålitelig og profesjonell taxitjeneste når du trenger det',

    // Form labels
    pickupLocation: 'Hentested',
    dropoffLocation: 'Destinasjon',
    date: 'Dato',
    time: 'Tid',
    passengers: 'Passasjerer',
    vehicleType: 'Biltype',
    fullName: 'Fullt navn',
    phone: 'Telefonnummer',
    email: 'Epostadresse',
    additionalInfo: 'Tilleggsinformasjon',

    // Vehicle types
    estatecar: 'Stasjonsvogn',
    sixseater: '6-seter',
    sevenseater: '7-seter',
    eightseater: '8-seter',
    wheelchair: 'Rullestol',

    // Buttons
    confirmBooking: 'Bekreft Bestilling',
    booking: 'Bestilling...',
    checkStatus: 'Sjekk Booking-Status',

    // Status check
    bookingNumber: 'Bookingnummer',
    searchBooking: 'Søk Booking',
    bookingStatus: 'Booking-Status',
    bookingStatusTitle: 'Sjekk Status på Din Tur',

    // Status responses
    bookingFound: 'Booking funnet',
    bookingNotFound: 'Booking ikke funnet',
    status: 'Status',
    assignedVehicle: 'Tildelt kjøretøy',
    driver: 'Sjåfør',
    pending: 'Venter på godkjenning',
    accepted: 'Godkjent av kjøretøy',
    inProgress: 'Underveis',
    completed: 'Fullført',

    // Validation messages
    passenger: 'Passasjer',
    passengers_other: 'Passasjerer',
    specialRequests: 'Spesielle ønsker eller notat...',

    // Success message
    bookingConfirmed: '✓ Bestilling bekreftet! Sjekk eposten din for detaljer.',

    // Status footer
    supportText: '24/7 Kundeservice • Sikker Betaling • Profesjonelle Sjåfører',
  },

  en: {
    // Page title
    pageTitle: 'Book Taxi',

    // Header
    bookYourRide: 'Book Your Ride',
    subtitle: 'Fast, reliable, and professional taxi service at your fingertips',

    // Form labels
    pickupLocation: 'Pickup Location',
    dropoffLocation: 'Dropoff Location',
    date: 'Date',
    time: 'Time',
    passengers: 'Passengers',
    vehicleType: 'Vehicle Type',
    fullName: 'Full Name',
    phone: 'Phone Number',
    email: 'Email Address',
    additionalInfo: 'Additional Information',

    // Vehicle types
    estatecar: 'Estate Car',
    sixseater: '6-Seater',
    sevenseater: '7-Seater',
    eightseater: '8-Seater',
    wheelchair: 'Wheelchair Accessible',

    // Buttons
    confirmBooking: 'Confirm Booking',
    booking: 'Booking...',
    checkStatus: 'Check Booking Status',

    // Status check
    bookingNumber: 'Booking Number',
    searchBooking: 'Search Booking',
    bookingStatus: 'Booking Status',
    bookingStatusTitle: 'Check Your Booking Status',

    // Status responses
    bookingFound: 'Booking found',
    bookingNotFound: 'Booking not found',
    status: 'Status',
    assignedVehicle: 'Assigned Vehicle',
    driver: 'Driver',
    pending: 'Awaiting Acceptance',
    accepted: 'Accepted by Vehicle',
    inProgress: 'In Progress',
    completed: 'Completed',

    // Validation messages
    passenger: 'Passenger',
    passengers_other: 'Passengers',
    specialRequests: 'Any special requests or notes...',

    // Success message
    bookingConfirmed: '✓ Booking confirmed! Check your email for details.',

    // Status footer
    supportText: '24/7 Customer Support • Secure Payment • Professional Drivers',
  },
};

export function useTranslation(lang: Language) {
  return translations[lang];
}
