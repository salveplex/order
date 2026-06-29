'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Copy, CheckCircle, Clock, Loader } from 'lucide-react';
import { useTranslation, type Language } from '@/lib/i18n';

interface BookingTrackingProps {
  bookingNumber: string;
  language: Language;
  pickupLocation: string;
  dropoffLocation: string;
  driverPhone?: string;
}

interface BookingStatus {
  status: 'pending' | 'assigned' | 'accepted' | 'inProgress' | 'completed';
  statusCode?: string; // Raw Taxi4U status code
  vehicle?: string;
  driver?: string;
  found: boolean;
}

export default function BookingTracking({
  bookingNumber,
  language,
  pickupLocation,
  dropoffLocation,
  driverPhone,
}: BookingTrackingProps) {
  const t = useTranslation(language);
  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [notificationShown, setNotificationShown] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  // Poll for booking status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/bookings/status?id=${encodeURIComponent(bookingNumber)}`
        );
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
          setLoading(false);

          // Show notification when driver accepts
          if (
            data.status === 'accepted' &&
            !notificationShown
          ) {
            showNotifications(data);
            setNotificationShown(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch booking status:', error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(() => {
      pollStatus();
      setPollCount((c) => c + 1);
    }, 3000);

    // Initial check
    pollStatus();

    return () => clearInterval(interval);
  }, [bookingNumber, notificationShown]);

  const showNotifications = (bookingStatus: BookingStatus) => {
    const message = `🚗 ${language === 'en' ? 'Driver accepted! ' + (bookingStatus.vehicle || 'Taxi') + ' is on the way' : language === 'de' ? 'Fahrer akzeptiert! ' + (bookingStatus.vehicle || 'Taxi') + ' ist unterwegs' : language === 'fr' ? 'Chauffeur accepté! ' + (bookingStatus.vehicle || 'Taxi') + ' est en route' : language === 'es' ? '¡Conductor aceptado! ' + (bookingStatus.vehicle || 'Taxi') + ' está en camino' : 'Sjåfør akseptert! ' + (bookingStatus.vehicle || 'Taxi') + ' er på veg'}`;

    // Show browser push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Din taxi er på vei', {
        body: message,
        icon: '🚗',
        tag: `booking-${bookingNumber}`,
      });
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(bookingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    if (!window.confirm(
      language === 'en' ? 'Are you sure you want to cancel this booking?' : language === 'de' ? 'Möchten Sie diese Buchung wirklich stornieren?' : language === 'fr' ? 'Êtes-vous sûr de vouloir annuler cette réservation?' : language === 'es' ? '¿Está seguro de que desea cancelar esta reserva?' : 'Er du sikker på at du vil avbestille denne turen?'
    )) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingNumber }),
      });

      if (response.ok) {
        setCancelled(true);
        // Refresh status to confirm cancellation
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert(
          language === 'en' ? 'Failed to cancel booking. Please try again.' : language === 'de' ? 'Stornierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' : language === 'fr' ? 'Échec de l\'annulation. Veuillez réessayer plus tard.' : language === 'es' ? 'Fallo al cancelar. Por favor, inténtelo de nuevo más tarde.' : 'Kunne ikkje avbestille turen. Prøv igjen.'
        );
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert(
        language === 'en' ? 'Cancellation failed. Please try again.' : language === 'de' ? 'Stornierung fehlgeschlagen. Bitte versuchen Sie es später erneut.' : language === 'fr' ? 'Échec de l\'annulation. Veuillez réessayer plus tard.' : language === 'es' ? 'Fallo al cancelar. Por favor, inténtelo de nuevo más tarde.' : 'Avbestilling feila. Prøv igjen.'
      );
    } finally {
      setCancelling(false);
    }
  };

  // Can cancel if booking is still pending (before driver accepts)
  // Taxi4U status codes that allow cancellation: D, G, K, H
  // D = Accepted by system, G = Sent to drivers, K = Waiting for driver, H = Trying to reach driver
  // Cannot cancel: I (driver accepted), X (departed), N (ready for billing), l (completed), etc.
  const canCancel = status && !cancelled && status.statusCode && ['D', 'G', 'K', 'H'].includes(status.statusCode);

  if (status && pollCount % 10 === 0) {
    console.log(`🔍 Status check #${pollCount}: statusCode="${status.statusCode}", status="${status.status}", canCancel=${canCancel}`);
  }

  const getStatusIcon = () => {
    if (!status) return <Clock className="w-5 h-5" />;
    switch (status.status) {
      case 'assigned':
        return <Clock className="w-5 h-5 text-orange-400" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'inProgress':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTaxi4UStatusText = (taxi4uStatus?: string) => {
    if (!taxi4uStatus) return null;

    // Map Taxi4U status codes to user-friendly text
    const statusMap: Record<string, any> = {
      'A': { no: '⏳ Bil tildelt - ventar på sjåfør-godkjenning', en: '⏳ Car assigned - waiting for driver acceptance' },
      'D': { no: 'Ble akseptert av system', en: 'Accepted by system' },
      'G': { no: 'Sendt til sjåfører', en: 'Sent to drivers' },
      'I': { no: '✅ Sjåfør akseptert! Bil på vei', en: '✅ Driver accepted! Car is on the way' },
      'K': { no: 'Venter på svar fra sjåfør...', en: 'Waiting for driver response...' },
      'H': { no: 'Prøver å kontakte sjåfør...', en: 'Trying to reach driver...' },
      'X': { no: 'Tur gikk - bestilling kansellert', en: 'Trip departed - booking cancelled' },
      'N': { no: 'Klar for fakturering', en: 'Ready for invoicing' },
      'n': { no: 'Bestilling ble ikke brukt', en: 'Booking was not used' },
      'l': { no: '✅ Levert og fullført', en: '✅ Delivered and completed' },
      'P': { no: '🚖 Passasjer i bil', en: '🚖 Passenger on board' },
      'J': { no: 'Venter på svar...', en: 'Waiting for response...' },
    };

    return statusMap[taxi4uStatus] ? statusMap[taxi4uStatus][language] : null;
  };

  const getStatusText = () => {
    if (!status) {
      return language === 'en' ? 'Waiting for driver...' : language === 'de' ? 'Warten auf Fahrer...' : language === 'fr' ? 'En attente du chauffeur...' : language === 'es' ? 'Esperando al conductor...' : 'Ventar på sjåfør...';
    }

    // Use detailed Taxi4U status if available
    const taxi4uText = getTaxi4UStatusText(status.statusCode);
    if (taxi4uText) {
      return taxi4uText;
    }

    // Fallback to generic status
    switch (status.status) {
      case 'assigned':
        return language === 'en' ? '⏳ Car assigned - waiting for driver to accept' : language === 'de' ? '⏳ Auto zugewiesen - warte auf Fahrer-Bestätigung' : language === 'fr' ? '⏳ Voiture assignée - en attente de la confirmation du chauffeur' : language === 'es' ? '⏳ Auto asignado - esperando confirmación del conductor' : '⏳ Bil tildelt - ventar på sjåfør-godkjenning';
      case 'accepted':
        return `🚗 ${language === 'en' ? 'Driver accepted! ' + (status.vehicle || 'Taxi') + ' is on the way' : language === 'de' ? 'Fahrer akzeptiert! ' + (status.vehicle || 'Taxi') + ' ist unterwegs' : language === 'fr' ? 'Chauffeur accepté! ' + (status.vehicle || 'Taxi') + ' est en route' : language === 'es' ? '¡Conductor aceptado! ' + (status.vehicle || 'Taxi') + ' está en camino' : 'Sjåfør akseptert! ' + (status.vehicle || 'Taxi') + ' er på veg'}`;
      case 'inProgress':
        return language === 'en' ? '🚖 Passenger on board' : language === 'de' ? '🚖 Passagier an Bord' : language === 'fr' ? '🚖 Passager à bord' : language === 'es' ? '🚖 Pasajero a bordo' : '🚖 Passasjer i bil';
      case 'completed':
        return language === 'en' ? '✅ Trip completed' : language === 'de' ? '✅ Fahrt abgeschlossen' : language === 'fr' ? '✅ Trajet terminé' : language === 'es' ? '✅ Viaje completado' : '✅ Tur fullført';
      default:
        return language === 'en' ? 'Waiting for driver...' : language === 'de' ? 'Warten auf Fahrer...' : language === 'fr' ? 'En attente du chauffeur...' : language === 'es' ? 'Esperando al conductor...' : 'Ventar på sjåfør...';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 p-6 md:p-8 shadow-sm">
        {/* Booking Number */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {t.bookingNumber}
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-2xl font-bold text-amber-600">
              {bookingNumber}
            </div>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={language === 'en' ? 'Copy' : language === 'de' ? 'Kopieren' : language === 'fr' ? 'Copier' : language === 'es' ? 'Copiar' : 'Kopier'}
            >
              <Copy className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
            </button>
            {copied && (
              <span className="text-xs text-green-400">
                {language === 'en' ? 'Copied!' : language === 'de' ? 'Kopiert!' : language === 'fr' ? 'Copié !' : language === 'es' ? '¡Copiado!' : 'Kopiert!'}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {t.bookingNumber}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {getStatusText()}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t.bookingNumber}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 dark:text-gray-300">{pickupLocation}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {t.bookingNumber}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 dark:text-gray-300">{dropoffLocation}</div>
            </div>
          </div>
        </div>

        {/* Driver Info - Show when accepted */}
        {status?.status === 'accepted' && (
          <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t.bookingNumber}
            </div>
            <div className="space-y-2">
              {status.driver && (
                <div className="text-sm text-gray-700 dark:text-gray-300">{status.driver}</div>
              )}
              {status.vehicle && (
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  🚗 {status.vehicle}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status?.status === 'accepted' && (
            <Link
              href={`/track/${bookingNumber}?lang=${language}`}
              className="block w-full px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-gray-900 dark:text-white font-semibold uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50 text-center text-sm md:text-base"
            >
              {language === 'en' ? '🗺️ Track on Map' : language === 'de' ? '🗺️ Auf Karte verfolgen' : language === 'fr' ? '🗺️ Suivre sur la carte' : language === 'es' ? '🗺️ Rastrear en el mapa' : '🗺️ Følg på kart'}
            </Link>
          )}

          {cancelled && (
            <div className="w-full px-6 py-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold uppercase tracking-wider text-center text-sm md:text-base">
              {language === 'en' ? '❌ Booking cancelled' : language === 'de' ? '❌ Buchung storniert' : language === 'fr' ? '❌ Réservation annulée' : language === 'es' ? '❌ Reserva cancelada' : '❌ Tinging avbestilt'}
            </div>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold uppercase tracking-wider transition-all duration-300 text-sm md:text-base"
            >
              {cancelling
                ? (language === 'en' ? '⏳ Cancelling...' : language === 'de' ? '⏳ Storniere...' : language === 'fr' ? '⏳ Annulation...' : language === 'es' ? '⏳ Cancelando...' : '⏳ Avbestiller...')
                : (language === 'en' ? '❌ Cancel Booking' : language === 'de' ? '❌ Fahrt stornieren' : language === 'fr' ? '❌ Annuler la réservation' : language === 'es' ? '❌ Cancelar Reserva' : '❌ Avbestill tur')}
            </button>
          )}

          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm md:text-base"
          >
            {language === 'en' ? 'New Booking' : language === 'de' ? 'Neue Buchung' : language === 'fr' ? 'Nouvelle réservation' : language === 'es' ? 'Nueva reserva' : 'Ny tinging'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          {language === 'nn'
            ? 'Hvis du ikke får oppdateringer, vent litt eller sjekk bookingnummeret'
            : 'If you don\'t get updates, wait a moment or check your booking number'}
        </div>
      </div>
    </div>
  );
}
