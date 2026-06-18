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
  { value: 'estatecar', label_no: 'Personbil', label_en: 'Car', icon: '🚗' },
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
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 py-3 md:py-4">
        {/* Combined header with language selector and tabs */}
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-3 md:px-6 py-1.5 md:py-2 rounded-md text-sm md:text-base font-medium transition-colors ${
                activeTab === 'booking'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'no' ? 'Bestill' : 'Book'}
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-3 md:px-6 py-1.5 md:py-2 rounded-md text-sm md:text-base font-medium transition-colors ${
                activeTab === 'status'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.checkStatus}
            </button>
          </div>

          {/* Language selector */}
          <div className="flex gap-1 md:gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setLanguage('no')}
              className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                language === 'no'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              NO
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12">
        {/* Booking Form Tab */}
        {activeTab === 'booking' && (
          <div className="w-full max-w-3xl">
            {/* Header */}
            <div className="mb-6 md:mb-12 text-center">
              <h1 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2 md:mb-3 tracking-tight">
                {t.bookYourRide}
              </h1>
              <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                {t.subtitle}
              </p>
            </div>

            {/* Form Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-8">
                {/* Pickup & Dropoff */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Pickup Location */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.pickupLocation}
                    </label>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                      {showPickupSuggestions && (pickupSuggestions.length > 0 || formData.pickupLocation.length >= 2) && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            right: '0',
                            marginTop: '8px',
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            zIndex: 99999,
                            maxHeight: '280px',
                            overflowY: 'auto',
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
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                              >
                                {suggestion.name}{suggestion.address && suggestion.address !== suggestion.name ? `, ${suggestion.address}` : ''}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2.5 text-sm text-gray-500">
                              {language === 'no'
                                ? 'Ingen forslag funnet, men du kan skrive adressen selv'
                                : 'No suggestions found, but you can enter the address yourself'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropoff Location */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.dropoffLocation}
                    </label>
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
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                      {showDropoffSuggestions &&
                        (dropoffSuggestions.length > 0 || formData.dropoffLocation.length >= 2) && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              right: '0',
                              marginTop: '8px',
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '0.5rem',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              zIndex: 99999,
                              maxHeight: '280px',
                              overflowY: 'auto',
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
                                  className="w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  {suggestion.name}{suggestion.address && suggestion.address !== suggestion.name ? `, ${suggestion.address}` : ''}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2.5 text-sm text-gray-500">
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

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.date}
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.time}
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Passengers & Car Type */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Passengers */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.passengers}
                    </label>
                    <select
                      name="passengers"
                      value={formData.passengers}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} {language === 'no' ? (num === 1 ? 'Passasjer' : 'Passasjerer') : num === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Car Type */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.vehicleType}
                    </label>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {CAR_TYPES.map((car) => (
                        <button
                          key={car.value}
                          type="button"
                          onClick={() => handleCarTypeChange(car.value)}
                          className={`px-3 md:px-4 py-3 md:py-4 rounded-lg text-sm md:text-base font-medium text-center transition-colors break-words ${
                            formData.carType === car.value
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-base block mb-1">{car.icon}</span>
                          <span className="inline text-xs md:text-sm">{language === 'no' ? car.label_no : car.label_en}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {language === 'no'
                        ? 'For bestilling til flere enn 8, ring sentralen'
                        : 'For bookings with more than 8 people, call the office'}
                    </p>
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Name */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.fullName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={language === 'no' ? 'Ditt fulle navn' : 'Your full name'}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.phone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={language === 'no' ? '+47 XXX XX XXX' : '+47 XXX XX XXX'}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.email} <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={language === 'no' ? 'Din epost (valgfritt)' : 'Your email (optional)'}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                {/* Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.additionalInfo}
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    placeholder={t.specialRequests}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t.booking : t.confirmBooking}
                  </button>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    {language === 'no'
                      ? 'Når en bil godkjenner turen, vil du få melding og mulighet for å spore bilen.'
                      : 'When a vehicle accepts your ride, you will receive a notification and the ability to track the vehicle.'}
                  </p>
                </div>

                {/* Booking Tracking */}
                {success && bookingNumber && (
                  <BookingTracking
                    bookingNumber={bookingNumber}
                    language={language}
                    pickupLocation={formData.pickupLocation}
                    dropoffLocation={formData.dropoffLocation}
                  />
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-gray-600 text-sm">
              <p>{t.supportText}</p>
            </div>
          </div>
        )}

        {/* Status Check Tab */}
        {activeTab === 'status' && (
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
                {t.bookingStatusTitle}
              </h1>
              <p className="text-gray-600 text-base max-w-2xl mx-auto">
                {language === 'no'
                  ? 'Skriv inn ditt bookingnummer for å sjekke status på turen.'
                  : 'Enter your booking number to check the status of your ride.'}
              </p>
            </div>

            {/* Status Form Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
              <form onSubmit={handleCheckStatus} className="space-y-6">
                {/* Booking Number Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.bookingNumber}
                  </label>
                  <input
                    type="text"
                    value={statusBookingNumber}
                    onChange={(e) => setStatusBookingNumber(e.target.value)}
                    placeholder={language === 'no' ? 'F.eks. BK-1234567' : 'e.g. BK-1234567'}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="w-full px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {statusLoading ? language === 'no' ? 'Søker...' : 'Searching...' : t.searchBooking}
                </button>

                {/* Status Display */}
                {bookingStatus && (
                  <div className="p-6 bg-green-50 border border-green-200 rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold text-green-900">{t.bookingFound}</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-green-200">
                        <span className="text-gray-600">{t.bookingNumber}:</span>
                        <span className="font-semibold text-gray-900">{bookingStatus.bookingNumber}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-green-200">
                        <span className="text-gray-600">{t.status}:</span>
                        <span className="font-semibold text-green-700">
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
                        <div className="flex justify-between items-center pb-3 border-b border-green-200">
                          <span className="text-gray-600">{t.assignedVehicle}:</span>
                          <span className="font-semibold text-gray-900">{bookingStatus.vehicle}</span>
                        </div>
                      )}
                      {bookingStatus.driver && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">{t.driver}:</span>
                          <span className="font-semibold text-gray-900">{bookingStatus.driver}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {statusError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{statusError}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
