const fs = require('fs');
let code = fs.readFileSync('components/BookingTracking.tsx', 'utf8');

// Replace Record<string, { no: string; en: string }> with any to avoid TS errors
code = code.replace(/Record<string, \{ no: string; en: string \}>/g, 'Record<string, any>');

// Replace statusMap definitions
const oldStatusMap = `'D': { no: 'Ble akseptert av system', en: 'Accepted by system' },
      'G': { no: 'Sendt til sjåfører', en: 'Sent to drivers' },
      'I': { no: '✅ Sjåfør akseptert!', en: '✅ Driver accepted!' },
      'K': { no: 'Venter på svar fra sjåfør...', en: 'Waiting for driver response...' },
      'H': { no: 'Prøver å kontakte sjåfør...', en: 'Trying to reach driver...' },
      'X': { no: 'Tur gikk - bestilling kansellert', en: 'Trip departed - booking cancelled' },
      'N': { no: 'Klar for fakturering', en: 'Ready for invoicing' },
      'n': { no: 'Bestilling ble ikke brukt', en: 'Booking was not used' },
      'l': { no: '✅ Levert og fullført', en: '✅ Delivered and completed' },
      'J': { no: 'Venter på svar...', en: 'Waiting for response...' },`;

const newStatusMap = `'D': { no: 'Ble akseptert av system', nn: 'Blei akseptert av systemet', en: 'Accepted by system', de: 'Vom System akzeptiert', fr: 'Accepté par le système', es: 'Aceptado por el sistema' },
      'G': { no: 'Sendt til sjåfører', nn: 'Sendt til sjåførar', en: 'Sent to drivers', de: 'An Fahrer gesendet', fr: 'Envoyé aux chauffeurs', es: 'Enviado a conductores' },
      'I': { no: '✅ Sjåfør akseptert!', nn: '✅ Sjåfør akseptert!', en: '✅ Driver accepted!', de: '✅ Fahrer akzeptiert!', fr: '✅ Chauffeur accepté!', es: '✅ Conductor aceptado!' },
      'K': { no: 'Venter på svar fra sjåfør...', nn: 'Ventar på svar frå sjåfør...', en: 'Waiting for driver response...', de: 'Warten auf Fahrerantwort...', fr: 'En attente de la réponse du chauffeur...', es: 'Esperando respuesta del conductor...' },
      'H': { no: 'Prøver å kontakte sjåfør...', nn: 'Prøver å kontakte sjåfør...', en: 'Trying to reach driver...', de: 'Versuche Fahrer zu erreichen...', fr: 'Tentative de contact avec le chauffeur...', es: 'Intentando contactar al conductor...' },
      'X': { no: 'Tur gikk - bestilling kansellert', nn: 'Tur gjekk - tinging kansellert', en: 'Trip departed - booking cancelled', de: 'Fahrt abgefahren - Buchung storniert', fr: 'Trajet parti - réservation annulée', es: 'Viaje iniciado - reserva cancelada' },
      'N': { no: 'Klar for fakturering', nn: 'Klar for fakturering', en: 'Ready for invoicing', de: 'Bereit zur Rechnungsstellung', fr: 'Prêt pour la facturation', es: 'Listo para facturación' },
      'n': { no: 'Bestilling ble ikke brukt', nn: 'Tinging blei ikkje brukt', en: 'Booking was not used', de: 'Buchung wurde nicht genutzt', fr: 'La réservation n\\'a pas été utilisée', es: 'La reserva no fue utilizada' },
      'l': { no: '✅ Levert og fullført', nn: '✅ Levert og fullført', en: '✅ Delivered and completed', de: '✅ Geliefert und abgeschlossen', fr: '✅ Livré et terminé', es: '✅ Entregado y completado' },
      'J': { no: 'Venter på svar...', nn: 'Ventar på svar...', en: 'Waiting for response...', de: 'Warten auf Antwort...', fr: 'En attente de réponse...', es: 'Esperando respuesta...' },`;

code = code.replace(oldStatusMap, newStatusMap);


// Replace inline translations safely using string splitting or careful regex

// `🚗 Sjåfør akseptert...`
code = code.replace(/const message = language === 'no'\s*\?\s*`🚗 Sjåfør akseptert! \$\{bookingStatus\.vehicle \|\| 'Taxi'\} er på vei`\s*:\s*`🚗 Driver accepted! \$\{bookingStatus\.vehicle \|\| 'Taxi'\} is on the way`;/, 
  `const message = \`🚗 \$\{language === 'en' ? 'Driver accepted! ' + (bookingStatus.vehicle || 'Taxi') + ' is on the way' : language === 'de' ? 'Fahrer akzeptiert! ' + (bookingStatus.vehicle || 'Taxi') + ' ist unterwegs' : language === 'fr' ? 'Chauffeur accepté! ' + (bookingStatus.vehicle || 'Taxi') + ' est en route' : language === 'es' ? '¡Conductor aceptado! ' + (bookingStatus.vehicle || 'Taxi') + ' está en camino' : 'Sjåfør akseptert! ' + (bookingStatus.vehicle || 'Taxi') + ' er på veg'}\`;`);

// `Er du sikker på at du vil avbestille turen?`
code = code.replace(/language === 'no'\s*\?\s*'Er du sikker på at du vil avbestille turen\?'\s*:\s*'Are you sure you want to cancel this booking\?'/,
  `language === 'en' ? 'Are you sure you want to cancel this booking?' : language === 'de' ? 'Möchten Sie diese Buchung wirklich stornieren?' : language === 'fr' ? 'Êtes-vous sûr de vouloir annuler cette réservation?' : language === 'es' ? '¿Está seguro de que desea cancelar esta reserva?' : 'Er du sikker på at du vil avbestille denne turen?'`);

// `Kunne ikke avbestille turen. Prøv igjen.`
code = code.replace(/language === 'no'\s*\?\s*'Kunne ikke avbestille turen\. Prøv igjen\.'\s*:\s*'Failed to cancel booking\. Please try again\.'/g,
  `language === 'en' ? 'Failed to cancel booking. Please try again.' : language === 'de' ? 'Stornierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' : language === 'fr' ? 'Échec de l\\'annulation. Veuillez réessayer plus tard.' : language === 'es' ? 'Fallo al cancelar. Por favor, inténtelo de nuevo más tarde.' : 'Kunne ikkje avbestille turen. Prøv igjen.'`);

// `Feil ved avbestilling. Prøv igjen.`
code = code.replace(/language === 'no'\s*\?\s*'Feil ved avbestilling\. Prøv igjen\.'\s*:\s*'Error cancelling booking\. Please try again\.'/g,
  `language === 'en' ? 'Cancellation failed. Please try again.' : language === 'de' ? 'Stornierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' : language === 'fr' ? 'Échec de l\\'annulation. Veuillez réessayer plus tard.' : language === 'es' ? 'Fallo al cancelar. Por favor, inténtelo de nuevo más tarde.' : 'Avbestilling feila. Prøv igjen.'`);

code = code.replace(/language === 'no' \? 'Venter på sjåfør\.\.\.' : 'Waiting for driver\.\.\.'/g, 
  `language === 'en' ? 'Waiting for driver...' : language === 'de' ? 'Warten auf Fahrer...' : language === 'fr' ? 'En attente du chauffeur...' : language === 'es' ? 'Esperando al conductor...' : 'Ventar på sjåfør...'`);

code = code.replace(/language === 'no'\s*\?\s*`🚗 Sjåfør akseptert! \$\{status\.vehicle \|\| 'Taxi'\} er på vei`\s*:\s*`🚗 Driver accepted! \$\{status\.vehicle \|\| 'Taxi'\} is on the way`/g, 
  `\`🚗 \$\{language === 'en' ? 'Driver accepted! ' + (status.vehicle || 'Taxi') + ' is on the way' : language === 'de' ? 'Fahrer akzeptiert! ' + (status.vehicle || 'Taxi') + ' ist unterwegs' : language === 'fr' ? 'Chauffeur accepté! ' + (status.vehicle || 'Taxi') + ' est en route' : language === 'es' ? '¡Conductor aceptado! ' + (status.vehicle || 'Taxi') + ' está en camino' : 'Sjåfør akseptert! ' + (status.vehicle || 'Taxi') + ' er på veg'}\``);

code = code.replace(/language === 'no' \? 'Tur i gang\.\.\.' : 'Trip in progress\.\.\.'/g, 
  `language === 'en' ? 'Trip in progress...' : language === 'de' ? 'Fahrt läuft...' : language === 'fr' ? 'Trajet en cours...' : language === 'es' ? 'Viaje en curso...' : 'Tur i gang...'`);

code = code.replace(/language === 'no' \? 'Tur fullført' : 'Trip completed'/g, 
  `language === 'en' ? 'Trip completed' : language === 'de' ? 'Fahrt abgeschlossen' : language === 'fr' ? 'Trajet terminé' : language === 'es' ? 'Viaje completado' : 'Tur fullført'`);

code = code.replace(/language === 'no' \? 'Bookingnummer' : 'Booking Number'/g, `{t.bookingNumber}`);
code = code.replace(/language === 'no' \? 'Kopier' : 'Copy'/g, `language === 'en' ? 'Copy' : language === 'de' ? 'Kopieren' : language === 'fr' ? 'Copier' : language === 'es' ? 'Copiar' : 'Kopier'`);
code = code.replace(/language === 'no' \? 'Kopiert!' : 'Copied!'/g, `language === 'en' ? 'Copied!' : language === 'de' ? 'Kopiert!' : language === 'fr' ? 'Copié !' : language === 'es' ? '¡Copiado!' : 'Kopiert!'`);
code = code.replace(/language === 'no' \? 'Status' : 'Status'/g, `{t.status}`);
code = code.replace(/language === 'no' \? 'Hentested' : 'Pickup'/g, `{t.pickupLocation}`);
code = code.replace(/language === 'no' \? 'Destinasjon' : 'Dropoff'/g, `{t.dropoffLocation}`);
code = code.replace(/language === 'no' \? 'Sjåfør' : 'Driver'/g, `{t.driver}`);
code = code.replace(/language === 'no' \? '🗺️ Følg på kart' : '🗺️ Track on Map'/g, `language === 'en' ? '🗺️ Track on Map' : language === 'de' ? '🗺️ Auf Karte verfolgen' : language === 'fr' ? '🗺️ Suivre sur la carte' : language === 'es' ? '🗺️ Rastrear en el mapa' : '🗺️ Følg på kart'`);
code = code.replace(/language === 'no' \? '❌ Bestilling avbestilt' : '❌ Booking cancelled'/g, `language === 'en' ? '❌ Booking cancelled' : language === 'de' ? '❌ Buchung storniert' : language === 'fr' ? '❌ Réservation annulée' : language === 'es' ? '❌ Reserva cancelada' : '❌ Tinging avbestilt'`);
code = code.replace(/language === 'no' \? '⏳ Avbestiller\.\.\.' : '⏳ Cancelling\.\.\.'/g, `language === 'en' ? '⏳ Cancelling...' : language === 'de' ? '⏳ Storniere...' : language === 'fr' ? '⏳ Annulation...' : language === 'es' ? '⏳ Cancelando...' : '⏳ Avbestiller...'`);
code = code.replace(/language === 'no' \? '❌ Avbestill tur' : '❌ Cancel Booking'/g, `language === 'en' ? '❌ Cancel Booking' : language === 'de' ? '❌ Fahrt stornieren' : language === 'fr' ? '❌ Annuler la réservation' : language === 'es' ? '❌ Cancelar Reserva' : '❌ Avbestill tur'`);
code = code.replace(/language === 'no' \? 'Ny bestilling' : 'New Booking'/g, `language === 'en' ? 'New Booking' : language === 'de' ? 'Neue Buchung' : language === 'fr' ? 'Nouvelle réservation' : language === 'es' ? 'Nueva reserva' : 'Ny tinging'`);


fs.writeFileSync('components/BookingTracking.tsx', code);
console.log('Done rewriting BookingTracking.tsx');
