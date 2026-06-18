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

  const getStatusText = () => {
    if (!status) {
      return language === 'no' ? 'Venter på sjåfør...' : 'Waiting for driver...';
    }
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
        return language === 'no' ? 'Pending' : 'Pending';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
      <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 md:p-8 backdrop-blur-xl">
        {/* Booking Number */}
        <div className="mb-6 pb-6 border-b border-slate-700/50">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
            {language === 'no' ? 'Bookingnummer' : 'Booking Number'}
          </div>
          <div className="flex items-center gap-3">
            <div className="font-mono text-2xl font-bold text-blue-400">
              {bookingNumber}
            </div>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title={language === 'no' ? 'Kopier' : 'Copy'}
            >
              <Copy className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
            {copied && (
              <span className="text-xs text-green-400">
                {language === 'no' ? 'Kopiert!' : 'Copied!'}
              </span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="mb-6 pb-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="text-sm text-slate-400 mb-1">
                {language === 'no' ? 'Status' : 'Status'}
              </div>
              <div className="text-lg font-semibold text-white">
                {getStatusText()}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="mb-6 pb-6 border-b border-slate-700/50 space-y-4">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              {language === 'no' ? 'Hentested' : 'Pickup'}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-300">{pickupLocation}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">
              {language === 'no' ? 'Destinasjon' : 'Dropoff'}
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-300">{dropoffLocation}</div>
            </div>
          </div>
        </div>

        {/* Driver Info - Show when accepted */}
        {status?.status === 'accepted' && (
          <div className="mb-6 pb-6 border-b border-slate-700/50">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-3">
              {language === 'no' ? 'Sjåfør' : 'Driver'}
            </div>
            <div className="space-y-2">
              {status.driver && (
                <div className="text-sm text-slate-300">{status.driver}</div>
              )}
              {status.vehicle && (
                <div className="text-sm text-slate-300">
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
              className="block w-full px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 text-center text-sm md:text-base"
            >
              {language === 'no' ? '🗺️ Følg på kart' : '🗺️ Track on Map'}
            </Link>
          )}

          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 rounded-full border border-slate-600 text-slate-300 font-semibold uppercase tracking-wider transition-all duration-300 hover:bg-slate-800 text-sm md:text-base"
          >
            {language === 'no' ? 'Ny bestilling' : 'New Booking'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-slate-700/50 text-xs text-slate-500 text-center">
          {language === 'no'
            ? 'Hvis du ikke får oppdateringer, vent litt eller sjekk bookingnummeret'
            : 'If you don\'t get updates, wait a moment or check your booking number'}
        </div>
      </div>
    </div>
  );
}
