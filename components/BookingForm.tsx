'use client';

import React, { useState } from 'react';
import { MapPin, Clock, Users, Car, Phone, Mail, MessageSquare, Search } from 'lucide-react';
import { useTranslation, type Language } from '@/lib/i18n';
import BookingTracking from '@/components/BookingTracking';
import {
  createBooking,
  getAddressSuggestions,
  getBookingStatus,
  type AddressSuggestion
} from '@/lib/taxi4u-api';

type CarType = 'estatecar' | 'sixseater' | 'eightseater' | 'wheelchair';

interface FormData {
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  passengers: number;
  carType: CarType;
  name: string;
  phone: string;
  email: string;
  additionalInfo: string;
  pickupLat?: number;
  pickupLon?: number;
  pickupCity?: string;
  dropoffLat?: number;
  dropoffLon?: number;
  dropoffCity?: string;
}

interface BookingStatus {
  bookingId: string;
  bookingNumber: string;
  status: 'pending' | 'accepted' | 'inProgress' | 'completed';
  vehicle?: string;
  driver?: string;
  found: boolean;
}

const CAR_TYPES: { value: CarType; label_no: string; label_en: string; icon: string }[] = [
  { value: 'estatecar', label_no: 'Stasjonsvogn', label_en: 'Estate Car', icon: '🚗' },
  { value: 'sixseater', label_no: '6-seter', label_en: '6-Seater', icon: '🚙' },
  { value: 'eightseater', label_no: '8-seter', label_en: '8-Seater', icon: '🚐' },
  { value: 'wheelchair', label_no: 'Rullestol', label_en: 'Wheelchair', icon: '♿' },
];

export default function BookingForm() {
  const [language, setLanguage] = useState<Language>('no');
  const t = useTranslation(language);

  const [activeTab, setActiveTab] = useState<'booking' | 'status'>('booking');

  // Request notification permission on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Initialize date and time with current values
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  // Booking form state
  const [formData, setFormData] = useState<FormData>({
    pickupLocation: '',
    dropoffLocation: '',
    date: today,
    time: currentTime,
    passengers: 1,
    carType: 'estatecar',
    name: '',
    phone: '',
    email: '',
    additionalInfo: '',
  });

  const [pickupSuggestions, setPickupSuggestions] = useState<AddressSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<AddressSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [bookingNumber, setBookingNumber] = useState('');

  // Status check state
  const [statusBookingNumber, setStatusBookingNumber] = useState('');
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Handle address input with autocomplete
  const handleAddressInput = async (
    field: 'pickupLocation' | 'dropoffLocation',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (value.length >= 2) {
      try {
        const suggestions = await getAddressSuggestions(value, language);
        if (field === 'pickupLocation') {
          setPickupSuggestions(suggestions);
          setShowPickupSuggestions(true);
        } else {
          setDropoffSuggestions(suggestions);
          setShowDropoffSuggestions(true);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }
  };

  const selectAddressSuggestion = (
    field: 'pickupLocation' | 'dropoffLocation',
    suggestion: AddressSuggestion
  ) => {
    // If suggestion is a POI/station with short address, combine name + address
    // e.g., "Voss stasjon" + "Voss" → "Voss stasjon, Voss"
    const finalAddress =
      suggestion.address && suggestion.address !== suggestion.name
        ? `${suggestion.name}, ${suggestion.address}`
        : suggestion.address;

    // Store address + coordinates + city for API submission
    if (field === 'pickupLocation') {
      setFormData((prev) => ({
        ...prev,
        [field]: finalAddress,
        pickupLat: suggestion.lat,
        pickupLon: suggestion.lng,
        pickupCity: suggestion.address || 'Voss',  // Default to Voss if no address city info
      }));
      setShowPickupSuggestions(false);
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: finalAddress,
        dropoffLat: suggestion.lat,
        dropoffLon: suggestion.lng,
        dropoffCity: suggestion.address || 'Voss',  // Default to Voss if no address city info
      }));
      setShowDropoffSuggestions(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'passengers' ? parseInt(value) : value,
    }));
  };

  const handleCarTypeChange = (carType: CarType) => {
    setFormData((prev) => ({
      ...prev,
      carType,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Helper function to check if date is a red day (Norwegian public holiday)
      const isRedDay = (date: Date): boolean => {
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // Fixed holidays
        const fixedHolidays = [
          [1, 1],    // New Year's Day
          [5, 1],    // Labour Day
          [5, 17],   // Constitution Day
          [12, 25],  // Christmas Day
          [12, 26],  // Boxing Day
        ];

        if (fixedHolidays.some(([m, d]) => m === month && d === day)) {
          return true;
        }

        // Moveable holidays (simplified - would need proper Easter calculation for full accuracy)
        // For now, approximate common dates for 2024-2026
        const year = date.getFullYear();
        const moveableHolidays: Array<[number, number, number]> = [
          // Easter varies, approximate dates
          ...(year === 2024 ? [[3, 28], [3, 29], [3, 31], [4, 1], [5, 9], [5, 10], [5, 19]] : []),
          ...(year === 2025 ? [[4, 18], [4, 19], [4, 20], [4, 21], [5, 29], [5, 30], [6, 8]] : []),
          ...(year === 2026 ? [[4, 3], [4, 4], [4, 5], [4, 6], [5, 14], [5, 15], [5, 24]] : []),
        ] as any;

        return moveableHolidays.some(([m, d]: any) => m === month && d === day);
      };

      // Helper function to check if date is between June 20 and August 20
      const isSummerException = (date: Date): boolean => {
        const month = date.getMonth() + 1;
        const day = date.getDate();

        if (month > 6 && month < 8) return true; // July
        if (month === 6 && day >= 20) return true; // June 20-30
        if (month === 8 && day <= 20) return true; // August 1-20
        return false;
      };

      const bookingDate = new Date(formData.date);
      const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 1-5 = Monday-Friday, 6 = Saturday
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const isSummer = isSummerException(bookingDate);
      const isHoliday = isRedDay(bookingDate);

      // Time restrictions don't apply during summer or on red days
      if (isWeekday && !isSummer && !isHoliday) {
        const [hours, minutes] = formData.time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;

        // Two restriction windows: 07:30-08:30 and 13:30-15:00
        const restrictions = [
          { start: 7 * 60 + 30, end: 8 * 60 + 30 },      // 07:30-08:30
          { start: 13 * 60 + 30, end: 15 * 60 },         // 13:30-15:00
        ];

        const isInRestrictionWindow = restrictions.some(
          (r) => totalMinutes >= r.start && totalMinutes < r.end
        );

        if (isInRestrictionWindow) {
          setError(
            language === 'no'
              ? 'Ring for å bestille i dette tidsrommet'
              : 'Call to book during this time'
          );
          setLoading(false);
          return;
        }
      }

      // Validation 2: Check distance from Uttrågata 19 (max 20 km)
      if (formData.pickupLat && formData.pickupLon) {
        const uttraataLat = 60.6281914;
        const uttraaataLon = 6.4222631;

        // Use OSRM to calculate actual road distance
        try {
          const distanceResponse = await fetch(
            `https://router.project-osrm.org/route/v1/car/${formData.pickupLon},${formData.pickupLat};${uttraaataLon},${uttraataLat}?overview=false`,
            { method: 'GET' }
          );

          if (distanceResponse.ok) {
            const distanceData = await distanceResponse.json();
            if (distanceData.routes && distanceData.routes[0]) {
              const distanceKm = distanceData.routes[0].distance / 1000;

              if (distanceKm > 20) {
                setError(
                  language === 'no'
                    ? `Hentested er for langt unna (${distanceKm.toFixed(1)} km). Maksimum 20 km fra Uttrågata 19.`
                    : `Pickup location is too far away (${distanceKm.toFixed(1)} km). Maximum 20 km from Uttrågata 19.`
                );
                setLoading(false);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('Could not calculate distance:', err);
          // Continue with booking anyway if distance calculation fails
        }
      }

      const response = await createBooking(formData);

      if (response.success) {
        setSuccess(true);
        setBookingNumber(response.bookingNumber);

        // Reset form but keep today's date and current time
        const resetToday = new Date().toISOString().split('T')[0];
        const resetNow = new Date();
        const resetTime = resetNow.getHours().toString().padStart(2, '0') + ':' + resetNow.getMinutes().toString().padStart(2, '0');

        setFormData({
          pickupLocation: '',
          dropoffLocation: '',
          date: resetToday,
          time: resetTime,
          passengers: 1,
          carType: 'estatecar',
          name: '',
          phone: '',
          email: '',
          additionalInfo: '',
          pickupLat: undefined,
          pickupLon: undefined,
          pickupCity: undefined,
          dropoffLat: undefined,
          dropoffLon: undefined,
          dropoffCity: undefined,
        });

        // Hide success message after 4 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 4000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create booking';
      setError(errorMessage);
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusLoading(true);
    setStatusError('');
    setBookingStatus(null);

    try {
      const status = await getBookingStatus(statusBookingNumber);

      if (status.found) {
        setBookingStatus(status);
      } else {
        setStatusError(
          language === 'no'
            ? 'Bookingnummer ikke funnet'
            : 'Booking not found'
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error checking booking';
      setStatusError(errorMessage);
      console.error('Status check error:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#050505] overflow-hidden">
      {/* Radial mesh gradient background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
      }} />

      <div className="relative z-20 min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12 md:py-20">
        {/* Floating Language Selector */}
        <div className="fixed top-6 right-6 md:top-8 md:right-8 z-50 flex gap-2 p-1.5 rounded-full backdrop-blur-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => setLanguage('no')}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              language === 'no'
                ? 'bg-blue-500/80 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NO
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              language === 'en'
                ? 'bg-blue-500/80 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        {/* Premium Tab Selector */}
        <div className="mb-16 flex gap-3 p-1.5 rounded-full backdrop-blur-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab('booking')}
            className={`px-8 py-3 rounded-full font-medium tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              activeTab === 'booking'
                ? 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'no' ? 'Bestill' : 'Book'}
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-8 py-3 rounded-full font-medium tracking-wide transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              activeTab === 'status'
                ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.checkStatus}
          </button>
        </div>

      {/* Premium Booking Form Tab */}
      {activeTab === 'booking' && (
        <div className="w-full max-w-3xl animate-[fadeInUp_0.8s_ease-out_0.5s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
          {/* Eyebrow + Heading */}
          <div className="mb-16 text-center">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
              <span className="text-xs font-medium tracking-[0.15em] text-blue-400 uppercase">Premium Experience</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white mb-4 leading-[1.1]">
              {t.bookYourRide}
            </h1>
            <p className="text-base text-slate-400 max-w-xl mx-auto font-light tracking-wide">
              {t.subtitle}
            </p>
          </div>

          {/* Double-Bezel Form Container */}
          <div className="p-2 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 shadow-2xl">
            {/* Inner Core */}
            <div className="p-8 md:p-12 rounded-[calc(2.5rem-0.375rem)] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <form onSubmit={handleSubmit} className="space-y-8 overflow-visible">
                {/* Pickup & Dropoff - Asymmetrical Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
                  {/* Pickup (larger - col-span-3 on md+) */}
                  <div className="md:col-span-3 group relative animate-[slideInLeft_0.6s_ease-out_0.3s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      <MapPin className="w-3.5 h-3.5 inline mr-2 text-emerald-400/70" />
                      {t.pickupLocation}
                    </label>
                    {/* Double-Bezel Pattern: Outer shell */}
                    <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl relative">
                      {/* Inner core */}
                      <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.pickupLocation}
                            onChange={(e) =>
                              handleAddressInput('pickupLocation', e.target.value)
                            }
                            onFocus={() =>
                              formData.pickupLocation.length >= 2 &&
                              setShowPickupSuggestions(true)
                            }
                            placeholder={language === 'no' ? 'F.eks. Voss Stasjon' : 'e.g. Voss Station'}
                            required
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                          />
                          {showPickupSuggestions && (pickupSuggestions.length > 0 || formData.pickupLocation.length >= 2) && (
                            <div
                              style={{
                                position: 'absolute !important' as any,
                                top: '100% !important' as any,
                                left: '0 !important' as any,
                                right: '0 !important' as any,
                                marginTop: '12px !important' as any,
                                backgroundColor: 'rgb(5, 5, 5) !important' as any,
                                border: '2px solid rgba(59, 130, 246, 0.3) !important' as any,
                                borderRadius: '1rem !important' as any,
                                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.08) !important' as any,
                                backdropFilter: 'blur(16px) !important' as any,
                                zIndex: 99999,
                                maxHeight: '280px !important' as any,
                                overflowY: 'auto !important' as any,
                                opacity: '1 !important' as any,
                                visibility: 'visible !important' as any,
                              }}
                            >
                              {pickupSuggestions.length > 0 ? (
                                pickupSuggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    selectAddressSuggestion('pickupLocation', suggestion)
                                  }
                                  style={{
                                    width: '100% !important' as any,
                                    padding: '14px 18px !important' as any,
                                    textAlign: 'left',
                                    backgroundColor: 'transparent !important' as any,
                                    color: 'white !important' as any,
                                    borderBottom: idx === pickupSuggestions.length - 1 ? 'none !important' as any : '1px solid rgba(59, 130, 246, 0.1) !important' as any,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease-[cubic-bezier(0.32,0.72,0,1)] !important' as any,
                                    display: 'block !important' as any,
                                    opacity: '1 !important' as any,
                                    fontSize: '14px !important' as any,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <div style={{ color: 'white', fontWeight: '500' }}>
                                    {suggestion.name}{suggestion.address && suggestion.address !== suggestion.name ? `, ${suggestion.address}` : ''}
                                  </div>
                                </button>
                                ))
                              ) : (
                                <div style={{ padding: '14px 18px', color: 'rgb(148, 163, 184)', fontSize: '13px', fontWeight: '400' }}>
                                  {language === 'no'
                                    ? 'Ingen forslag funnet, men du kan skrive adressen selv'
                                    : 'No suggestions found, but you can enter the address yourself'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dropoff Location with Autocomplete (col-span-2 on md+) */}
                  <div className="md:col-span-2 group relative animate-[slideInRight_0.6s_ease-out_0.3s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      <MapPin className="w-3.5 h-3.5 inline mr-2 text-red-400/70" />
                      {t.dropoffLocation}
                    </label>
                    {/* Double-Bezel Pattern: Outer shell */}
                    <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl relative">
                      {/* Inner core */}
                      <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.dropoffLocation}
                            onChange={(e) =>
                              handleAddressInput('dropoffLocation', e.target.value)
                            }
                            onFocus={() =>
                              formData.dropoffLocation.length >= 2 &&
                              setShowDropoffSuggestions(true)
                            }
                            placeholder={language === 'no' ? 'F.eks. Voss Sjukehus' : 'e.g. Voss Hospital'}
                            required
                            className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                          />
                          {showDropoffSuggestions &&
                            (dropoffSuggestions.length > 0 || formData.dropoffLocation.length >= 2) && (
                              <div
                                style={{
                                  position: 'absolute !important' as any,
                                  top: '100% !important' as any,
                                  left: '0 !important' as any,
                                  right: '0 !important' as any,
                                  marginTop: '12px !important' as any,
                                  backgroundColor: 'rgb(5, 5, 5) !important' as any,
                                  border: '2px solid rgba(59, 130, 246, 0.3) !important' as any,
                                  borderRadius: '1rem !important' as any,
                                  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.08) !important' as any,
                                  backdropFilter: 'blur(16px) !important' as any,
                                  zIndex: 99999,
                                  maxHeight: '280px !important' as any,
                                  overflowY: 'auto !important' as any,
                                  opacity: '1 !important' as any,
                                  visibility: 'visible !important' as any,
                                }}
                              >
                                {dropoffSuggestions.length > 0 ? (
                                  dropoffSuggestions.map((suggestion, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() =>
                                        selectAddressSuggestion(
                                          'dropoffLocation',
                                          suggestion
                                        )
                                      }
                                      style={{
                                        width: '100% !important' as any,
                                        padding: '14px 18px !important' as any,
                                        textAlign: 'left',
                                        backgroundColor: 'transparent !important' as any,
                                        color: 'white !important' as any,
                                        borderBottom: idx === dropoffSuggestions.length - 1 ? 'none !important' as any : '1px solid rgba(59, 130, 246, 0.1) !important' as any,
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s ease-[cubic-bezier(0.32,0.72,0,1)] !important' as any,
                                        display: 'block !important' as any,
                                        opacity: '1 !important' as any,
                                        fontSize: '14px !important' as any,
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      <div style={{ color: 'white', fontWeight: '500' }}>
                                        {suggestion.name}{suggestion.address && suggestion.address !== suggestion.name ? `, ${suggestion.address}` : ''}
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div style={{ padding: '14px 18px', color: 'rgb(148, 163, 184)', fontSize: '13px', fontWeight: '400' }}>
                                    {language === 'no'
                                      ? 'Ingen forslag funnet, men du kan skrive adressen selv'
                                      : 'No suggestions found, but you can enter the address yourself'}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date & Time - Asymmetrical Bento (date 2 cols, time 2 cols on md+) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                  {/* Date (col-span-2 on md+) */}
                  <div className="md:col-span-2 group animate-[slideInLeft_0.6s_ease-out_0.4s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      <Clock className="w-3.5 h-3.5 inline mr-2 text-blue-400/70" />
                      {t.date}
                    </label>
                    {/* Double-Bezel Pattern */}
                    <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                      <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                          className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time (col-span-2 on md+) */}
                  <div className="md:col-span-2 group animate-[slideInRight_0.6s_ease-out_0.4s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      <Clock className="w-3.5 h-3.5 inline mr-2 text-purple-400/70" />
                      {t.time}
                    </label>
                    {/* Double-Bezel Pattern */}
                    <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                      <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleInputChange}
                          required
                          className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passengers & Car Type - Asymmetrical Bento */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
                  {/* Passengers (col-span-2 on md+) */}
                  <div className="md:col-span-2 group animate-[slideInLeft_0.6s_ease-out_0.5s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      <Users className="w-3.5 h-3.5 inline mr-2 text-amber-400/70" />
                      {t.passengers}
                    </label>
                    {/* Double-Bezel Pattern */}
                    <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                      <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <select
                          name="passengers"
                          value={formData.passengers}
                          onChange={handleInputChange}
                          className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm appearance-none cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <option key={num} value={num}>
                              {num} {language === 'no' ? (num === 1 ? 'Passasjer' : 'Passasjerer') : num === 1 ? 'Passenger' : 'Passengers'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Car Type Selection - Visual Pill Grid (col-span-3 on md+) */}
                  <div className="md:col-span-3 animate-[slideInRight_0.6s_ease-out_0.5s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      <Car className="w-3.5 h-3.5 inline mr-2 text-cyan-400/70" />
                      {t.vehicleType}
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CAR_TYPES.map((car) => (
                        <button
                          key={car.value}
                          type="button"
                          onClick={() => handleCarTypeChange(car.value)}
                          className={`group/pill relative px-4 py-3 rounded-full text-xs font-semibold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${
                            formData.carType === car.value
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                              : 'bg-white/5 border border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/8'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-1.5 relative z-10">
                            <span className="text-sm">{car.icon}</span>
                            <span className="hidden sm:inline">{language === 'no' ? car.label_no : car.label_en}</span>
                          </span>
                          {formData.carType === car.value && (
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 blur-xl" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name & Phone - Asymmetrical Bento (name 3 cols, phone 2 cols on md+) */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
                  {/* Name (col-span-3 on md+) */}
                  <div className="md:col-span-3 group animate-[slideInLeft_0.6s_ease-out_0.6s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      {t.fullName} <span className="text-rose-400/80 ml-1">*</span>
                    </label>
                    {/* Double-Bezel Pattern */}
                    <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                      <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder={language === 'no' ? 'Ditt fulle navn' : 'Your full name'}
                          required
                          className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone (col-span-2 on md+) */}
                  <div className="md:col-span-2 group animate-[slideInRight_0.6s_ease-out_0.6s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                      <Phone className="w-3.5 h-3.5 inline mr-2 text-green-400/70" />
                      {t.phone} <span className="text-rose-400/80 ml-1">*</span>
                    </label>
                    {/* Double-Bezel Pattern */}
                    <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                      <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder={language === 'no' ? '+47 XXX XX XXX' : '+47 XXX XX XXX'}
                          required
                          className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email - Full width */}
                <div className="group animate-[slideInLeft_0.6s_ease-out_0.65s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                    <Mail className="w-3.5 h-3.5 inline mr-2 text-indigo-400/70" />
                    {t.email} <span className="text-slate-500 font-light ml-1">(optional)</span>
                  </label>
                  {/* Double-Bezel Pattern */}
                  <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                    <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={language === 'no' ? 'Din epost (valgfritt)' : 'Your email (optional)'}
                        className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info - Full width */}
                <div className="animate-[slideInUp_0.6s_ease-out_0.7s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                    <MessageSquare className="w-3.5 h-3.5 inline mr-2 text-pink-400/70" />
                    {t.additionalInfo}
                  </label>
                  {/* Double-Bezel Pattern */}
                  <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                    <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      <textarea
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        placeholder={t.specialRequests}
                        rows={3}
                        className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] resize-none backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button - Button-in-Button with Trailing Icon Circle */}
                <div className="animate-[slideInUp_0.6s_ease-out_0.8s_forwards] opacity-0 pt-8" style={{ animationFillMode: 'forwards' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full p-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-2xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  >
                    {/* Inner Button */}
                    <div className="relative w-full px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 text-white font-semibold uppercase tracking-wider transition-all duration-500 flex items-center justify-between overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-xl"
                      style={{
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 20px 25px -5px rgba(59, 130, 246, 0.2)',
                      }}
                    >
                      {/* Animated background shimmer */}
                      <div className="absolute inset-0 overflow-hidden rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                      </div>

                      {/* Text content */}
                      <span className="relative z-10 text-sm md:text-base leading-none">
                        {loading ? t.booking : t.confirmBooking}
                      </span>

                      {/* Trailing Icon Circle */}
                      <div className="relative z-10 w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center group-hover:translate-x-1.5 group-hover:scale-110 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-lg shadow-white/10">
                        <span className="text-white font-bold text-lg leading-none">→</span>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Booking Tracking - Show when successful */}
                {success && bookingNumber && (
                  <BookingTracking
                    bookingNumber={bookingNumber}
                    language={language}
                    pickupLocation={formData.pickupLocation}
                    dropoffLocation={formData.dropoffLocation}
                  />
                )}

                {/* Error Message - Premium Styling */}
                {error && (
                  <div className="animate-[slideInUp_0.4s_ease-out] p-2 rounded-[1.5rem] bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-400/30 shadow-lg shadow-red-500/10">
                    <div className="px-6 py-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-red-500/5 to-transparent border border-red-400/20 text-red-300 text-center font-semibold text-sm md:text-base">
                      {error}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 md:mt-12 text-center text-slate-400 text-xs md:text-sm animate-[fadeIn_1s_ease-out_1s_forwards]">
            <p>{t.supportText}</p>
          </div>
        </div>
      )}

      {/* Status Check Tab */}
      {activeTab === 'status' && (
        <div className="w-full max-w-2xl animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
          {/* Header */}
          <div className="mb-16 text-center">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 backdrop-blur-md">
              <span className="text-xs font-medium tracking-[0.15em] text-purple-400 uppercase">Booking Status</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white mb-4 leading-[1.1]">
              {t.bookingStatusTitle}
            </h1>
            <p className="text-base text-slate-400 max-w-xl mx-auto font-light tracking-wide">
              {language === 'no'
                ? 'Skriv inn ditt bookingnummer for å sjekke status på turen.'
                : 'Enter your booking number to check the status of your ride.'}
            </p>
          </div>

          {/* Status Form Container - Double-Bezel */}
          <div className="p-2 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 shadow-2xl">
            {/* Inner Core */}
            <div className="p-8 md:p-12 rounded-[calc(2.5rem-0.375rem)] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
              <form onSubmit={handleCheckStatus} className="space-y-8">
                {/* Booking Number Input */}
                <div className="group animate-[slideInLeft_0.6s_ease-out_0.3s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <label className="block text-xs font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">
                    <Search className="w-3.5 h-3.5 inline mr-2 text-blue-400/70" />
                    {t.bookingNumber}
                  </label>
                  {/* Double-Bezel Pattern */}
                  <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 shadow-xl">
                    <div className="p-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      <input
                        type="text"
                        value={statusBookingNumber}
                        onChange={(e) => setStatusBookingNumber(e.target.value)}
                        placeholder={language === 'no' ? 'F.eks. BK-1234567' : 'e.g. BK-1234567'}
                        required
                        className="w-full px-5 py-3.5 rounded-xl bg-slate-900/40 border border-white/8 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <div className="animate-[slideInUp_0.6s_ease-out_0.4s_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="group relative w-full p-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 shadow-2xl shadow-purple-500/10 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  >
                    {/* Inner Button */}
                    <div className="relative w-full px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 text-white font-semibold uppercase tracking-wider transition-all duration-500 flex items-center justify-between overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 20px 25px -5px rgba(168, 85, 247, 0.2)',
                      }}
                    >
                      {/* Animated background shimmer */}
                      <div className="absolute inset-0 overflow-hidden rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]" />
                      </div>

                      <span className="relative z-10 text-sm md:text-base leading-none">
                        {statusLoading ? language === 'no' ? 'Søker...' : 'Searching...' : t.searchBooking}
                      </span>
                      <Search className="w-5 h-5 relative z-10" />
                    </div>
                  </button>
                </div>

                {/* Status Display */}
                {bookingStatus && (
                  <div className="animate-[slideInUp_0.4s_ease-out] p-2 rounded-[1.5rem] bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                    <div className="p-6 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-400/20 space-y-4">
                      <h3 className="text-lg md:text-xl font-semibold text-emerald-300">{t.bookingFound}</h3>
                      <div className="space-y-4 text-sm md:text-base">
                        <div className="flex justify-between items-center pb-3 border-b border-emerald-400/10">
                          <span className="text-slate-400">{t.bookingNumber}:</span>
                          <span className="text-white font-semibold">{bookingStatus.bookingNumber}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-emerald-400/10">
                          <span className="text-slate-400">{t.status}:</span>
                          <span className="text-emerald-300 font-semibold">
                            {language === 'no'
                              ? bookingStatus.status === 'pending'
                                ? 'Venter på godkjenning'
                                : bookingStatus.status === 'accepted'
                                ? 'Godkjent av kjøretøy'
                                : bookingStatus.status === 'inProgress'
                                ? 'Underveis'
                                : 'Fullført'
                              : bookingStatus.status === 'pending'
                              ? 'Awaiting Acceptance'
                              : bookingStatus.status === 'accepted'
                              ? 'Accepted by Vehicle'
                              : bookingStatus.status === 'inProgress'
                              ? 'In Progress'
                              : 'Completed'}
                          </span>
                        </div>
                        {bookingStatus.vehicle && (
                          <div className="flex justify-between items-center pb-3 border-b border-emerald-400/10">
                            <span className="text-slate-400">{t.assignedVehicle}:</span>
                            <span className="text-white font-semibold">{bookingStatus.vehicle}</span>
                          </div>
                        )}
                        {bookingStatus.driver && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">{t.driver}:</span>
                            <span className="text-white font-semibold">{bookingStatus.driver}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message - Premium Styling */}
                {statusError && (
                  <div className="animate-[slideInUp_0.4s_ease-out] p-2 rounded-[1.5rem] bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-400/30 shadow-lg shadow-red-500/10">
                    <div className="px-6 py-4 rounded-[calc(1.5rem-0.25rem)] bg-gradient-to-br from-red-500/5 to-transparent border border-red-400/20 text-red-300 text-center font-semibold text-sm md:text-base">
                      {statusError}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
