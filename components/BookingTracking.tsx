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
  status: 'pending' | 'accepted' | 'inProgress' | 'completed';
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
    const message = language === 'no'
      ? `🚗 Sjåfør akseptert! ${bookingStatus.vehicle || 'Taxi'} er på vei`
      : `🚗 Driver accepted! ${bookingStatus.vehicle || 'Taxi'} is on the way`;

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
      language === 'no'
        ? 'Er du sikker på at du vil avbestille turen?'
        : 'Are you sure you want to cancel this booking?'
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
          language === 'no'
            ? 'Kunne ikke avbestille turen. Prøv igjen.'
            : 'Failed to cancel booking. Please try again.'
        );
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert(
        language === 'no'
          ? 'Feil ved avbestilling. Prøv igjen.'
          : 'Error cancelling booking. Please try again.'
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
    const statusMap: Record<string, { no: string; en: string }> = {
      'D': { no: 'Ble akseptert av system', en: 'Accepted by system' },
      'G': { no: 'Sendt til sjåfører', en: 'Sent to drivers' },
      'I': { no: '✅ Sjåfør akseptert!', en: '✅ Driver accepted!' },
      'K': { no: 'Venter på svar fra sjåfør...', en: 'Waiting for driver response...' },
      'H': { no: 'Prøver å kontakte sjåfør...', en: 'Trying to reach driver...' },
      'X': { no: 'Tur gikk - bestilling kansellert', en: 'Trip departed - booking cancelled' },
      'N': { no: 'Klar for fakturering', en: 'Ready for invoicing' },
      'n': { no: 'Bestilling ble ikke brukt', en: 'Booking was not used' },
      'l': { no: '✅ Levert og fullført', en: '✅ Delivered and completed' },
      'J': { no: 'Venter på svar...', en: 'Waiting for response...' }, // NEI-SVAR hidden as generic waiting
    };

    return statusMap[taxi4uStatus] ? statusMap[taxi4uStatus][language] : null;
  };

  const getStatusText = () => {
    if (!status) {
      return language === 'no' ? 'Venter på sjåfør...' : 'Waiting for driver...';
    }

    // Use detailed Taxi4U status if available
    const taxi4uText = getTaxi4UStatusText(status.statusCode);
    if (taxi4uText) {
      return taxi4uText;
    }

    // Fallback to generic status
    switch (status.status) {
      case 'accepted':
        return language === 'no'
          ? `🚗 Sjåfør akseptert! ${status.vehicle || 'Taxi'} er på vei`
          : `🚗 Driver accepted! ${status.vehicle || 'Taxi'} is on the way`;
      case 'inProgress':
        return language === 'no' ? 'Tur i gang...' : 'Trip in progress...';
      case 'completed':
        return language === 'no' ? 'Tur fullført' : 'Trip completed';
      default:
        return language === 'no' ? 'Venter på sjåfør...' : 'Waiting for driver...';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
      <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 dark:border-gray-700 p-6 md:p-8 shadow-sm">
        {/* Booking Number */}
        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {language === 'no' ? 'Bookingnummer' : 'Booking Number'}
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-2xl font-bold text-amber-600">
              {bookingNumber}
            </div>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={language === 'no' ? 'Kopier' : 'Copy'}
            >
              <Copy className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
            </button>
            {copied && (
              <span className="text-xs text-green-400">
                {language === 'no' ? 'Kopiert!' : 'Copied!'}
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
                {language === 'no' ? 'Status' : 'Status'}
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
              {language === 'no' ? 'Hentested' : 'Pickup'}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-700 dark:text-gray-300">{pickupLocation}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {language === 'no' ? 'Destinasjon' : 'Dropoff'}
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
              {language === 'no' ? 'Sjåfør' : 'Driver'}
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
              href={`/track/${bookingNumber}`}
              className="block w-full px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-gray-900 dark:text-white font-semibold uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50 text-center text-sm md:text-base"
            >
              {language === 'no' ? '🗺️ Følg på kart' : '🗺️ Track on Map'}
            </Link>
          )}

          {cancelled && (
            <div className="w-full px-6 py-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold uppercase tracking-wider text-center text-sm md:text-base">
              {language === 'no' ? '❌ Bestilling avbestilt' : '❌ Booking cancelled'}
            </div>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold uppercase tracking-wider transition-all duration-300 text-sm md:text-base"
            >
              {cancelling
                ? (language === 'no' ? '⏳ Avbestiller...' : '⏳ Cancelling...')
                : (language === 'no' ? '❌ Avbestill tur' : '❌ Cancel Booking')}
            </button>
          )}

          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm md:text-base"
          >
            {language === 'no' ? 'Ny bestilling' : 'New Booking'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          {language === 'no'
            ? 'Hvis du ikke får oppdateringer, vent litt eller sjekk bookingnummeret'
            : 'If you don\'t get updates, wait a moment or check your booking number'}
        </div>
      </div>
    </div>
  );
}
