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
interface FormData {
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  passengers: number;
  attributes: number[];
  hasBike: boolean;
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

const ATTRIBUTE_GROUPS = [
  {
    id: 'biltype',
    label_no: 'Biltype',
    label_en: 'Vehicle Type',
    icon: '🚗',
    options: [
      { id: 20, label_no: 'Liten bil', label_en: 'Small Car' },
      { id: 3, label_no: 'Lav bil / Personbil', label_en: 'Low Car / Standard' },
      { id: 0, label_no: '6 seter', label_en: '6 Seater' },
      { id: 1, label_no: '7 seter', label_en: '7 Seater' },
      { id: 89, label_no: '8 seter', label_en: '8 Seater' },
      { id: 4, label_no: 'Rullestol', label_en: 'Wheelchair' }
    ]
  },
  {
    id: 'bagasje',
    label_no: 'Bagasje/utstyr',
    label_en: 'Luggage/Equipment',
    icon: '🧳',
    options: [
      { id: 23, label_no: 'Mykje bagasje', label_en: 'Lots of luggage' },
      { id: 99, label_no: 'Ekstra bagasjeplass', label_en: 'Extra luggage space' },
      { id: 21, label_no: 'Har med ski', label_en: 'Bringing skis' },
      { id: 22, label_no: 'Har med snowboard', label_en: 'Bringing snowboard' },
      { id: 24, label_no: 'Har med hund', label_en: 'Bringing dog' },
      { id: -1, label_no: 'Har med sykkel', label_en: 'Bringing bicycle' }
    ]
  },
  {
    id: 'barneseter',
    label_no: 'Barneseter',
    label_en: 'Child Seats',
    icon: '👶',
    options: [
      { id: 29, label_no: 'Barnestol 0-1 år/0-13 kg', label_en: 'Child seat 0-1 yrs' },
      { id: 30, label_no: 'Barnestol 1-4 år/9-18 kg', label_en: 'Child seat 1-4 yrs' },
      { id: 31, label_no: 'Barnestol 4-10 år/15-25 kg', label_en: 'Child seat 4-10 yrs' },
      { id: 25, label_no: 'Barnepute', label_en: 'Booster seat' },
      { id: 27, label_no: 'Spedbarnstol', label_en: 'Infant seat' }
    ]
  },
  {
    id: 'helse',
    label_no: 'Helse/Behov',
    label_en: 'Health/Needs',
    icon: '♿',
    options: [
      { id: 16, label_no: 'Trenger assistanse', label_en: 'Needs assistance' },
      { id: 19, label_no: 'Har rullator', label_en: 'Has rollator' },
      { id: 39, label_no: 'Høg innstiging', label_en: 'High boarding' },
      { id: 40, label_no: 'Allergi', label_en: 'Allergies' },
      { id: 41, label_no: 'Røykfri', label_en: 'Smoke-free' },
      { id: 9, label_no: 'Sammenleggbar rullestol', label_en: 'Foldable wheelchair' }
    ]
  },
  {
    id: 'anna',
    label_no: 'Anna nyttig',
    label_en: 'Other',
    icon: '⭐',
    options: [
      { id: 63, label_no: 'Må ha 4WD', label_en: 'Needs 4WD' },
      { id: 62, label_no: 'Må ha piggdekk', label_en: 'Needs studded tires' },
      { id: 75, label_no: 'Engelskspråkleg sjåfør', label_en: 'English-speaking driver' },
      { id: 73, label_no: 'Kvinnleg sjåfør', label_en: 'Female driver' }
    ]
  }
];

const TIME_OPTIONS = Array.from({ length: 24 * 4 }).map((_, i) => {
  const h = Math.floor(i / 4).toString().padStart(2, '0');
  const m = ((i % 4) * 15).toString().padStart(2, '0');
  return `${h}:${m}`;
});

export default function BookingForm() {
  const [language, setLanguage] = useState<Language>('no');
  const t = useTranslation(language);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = useState(false);

  const [activeTab, setActiveTab] = useState<'booking' | 'status'>('booking');
  const timeInputRef = React.useRef<HTMLInputElement>(null);

  // Request notification permission on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Handle theme changes
  React.useEffect(() => {
    const applyTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
      setIsDark(shouldBeDark);

      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
      }
    };

    if (typeof window !== 'undefined') {
      applyTheme();

      if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', applyTheme);
        return () => mediaQuery.removeEventListener('change', applyTheme);
      }
    }
  }, [theme]);

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
    attributes: [],
    hasBike: false,
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
  const [lastBookingPickup, setLastBookingPickup] = useState('');
  const [lastBookingDropoff, setLastBookingDropoff] = useState('');

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

  const toggleAttribute = (attrId: number) => {
    if (attrId === -1) {
      setFormData(prev => ({ ...prev, hasBike: !prev.hasBike }));
      return;
    }
    
    setFormData(prev => {
      let newAttributes = [...prev.attributes];
      
      // Toggle attributes (allow multiple selections everywhere)
      if (newAttributes.includes(attrId)) {
        newAttributes = newAttributes.filter(id => id !== attrId);
      } else {
        newAttributes.push(attrId);
      }
      
      return { ...prev, attributes: newAttributes };
    });
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
        // Save booking locations before resetting form
        setLastBookingPickup(formData.pickupLocation);
        setLastBookingDropoff(formData.dropoffLocation);
        // Auto-fill status tab with booking number
        setStatusBookingNumber(response.bookingNumber);
        // Auto-switch to status tab
        setActiveTab('status');

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
          attributes: [],
          hasBike: false,
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

        // Don't hide success message - keep it visible
        // setTimeout(() => {
        //   setSuccess(false);
        // }, 4000);
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
    <div className="min-h-screen bg-white dark:bg-gray-950 dark:text-white transition-colors">
      <div className="w-full px-4 py-3 md:py-4">
        {/* Combined header with language selector and tabs */}
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-3 md:px-6 py-1.5 md:py-2 rounded-md text-sm md:text-base font-medium transition-colors ${
                activeTab === 'booking'
                  ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 dark:text-white'
              }`}
            >
              {language === 'no' ? 'Bestill' : 'Book'}
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-3 md:px-6 py-1.5 md:py-2 rounded-md text-sm md:text-base font-medium transition-colors ${
                activeTab === 'status'
                  ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 dark:text-white'
              }`}
            >
              {t.checkStatus}
            </button>
          </div>

          {/* Language and Theme selectors */}
          <div className="flex gap-2 flex-wrap">
            {/* Language selector */}
            <div className="flex gap-1 md:gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setLanguage('no')}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  language === 'no'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                NO
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme selector */}
            <div className="flex gap-1 md:gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                title="Lys tema"
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                ☀️
              </button>
              <button
                onClick={() => setTheme('system')}
                title="Systeminstilling"
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  theme === 'system'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                ⚙️
              </button>
              <button
                onClick={() => setTheme('dark')}
                title="Mørk tema"
                className={`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                🌙
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-8 md:py-12">
        {/* Booking Form Tab */}
        {activeTab === 'booking' && (
          <div className="w-full max-w-3xl">
            {/* Header */}
            <div className="mb-6 md:mb-12 text-center">
              <h1 className="text-3xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 tracking-tight">
                {t.bookYourRide}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                {t.subtitle}
              </p>
            </div>

            {/* Form Container */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 dark:border-gray-700 p-5 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-8">
                {/* Pickup & Dropoff */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Pickup Location */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                      {showPickupSuggestions && (pickupSuggestions.length > 0 || formData.pickupLocation.length >= 2) && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            right: '0',
                            marginTop: '8px',
                            backgroundColor: isDark ? '#1f2937' : 'white',
                            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
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
                                className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
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
                              backgroundColor: isDark ? '#1f2937' : 'white',
                              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
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
                                  className="w-full px-4 py-2.5 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  {suggestion.name}{suggestion.address && suggestion.address !== suggestion.name ? `, ${suggestion.address}` : ''}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.date}
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {/* Time */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.time}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-10 py-2.5 appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                      >
                        {!TIME_OPTIONS.includes(formData.time) && (
                          <option value={formData.time}>{formData.time}</option>
                        )}
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passengers & Car Type */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Passengers */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.passengers}
                    </label>
                    <select
                      name="passengers"
                      value={formData.passengers}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} {language === 'no' ? (num === 1 ? 'Passasjer' : 'Passasjerer') : num === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicle Attributes */}
                  <div className="md:col-span-5 space-y-4 mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'no' ? 'Kjøretøy og behov' : 'Vehicle and Needs'}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {ATTRIBUTE_GROUPS.map((group) => {
                        const selectedCount = group.options.filter(opt => 
                          opt.id === -1 ? formData.hasBike : formData.attributes.includes(opt.id)
                        ).length;

                        return (
                          <details key={group.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 group overflow-hidden">
                            <summary className="p-3.5 font-medium text-gray-900 dark:text-white flex items-center justify-between cursor-pointer list-none select-none">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{group.icon}</span>
                                <span className="text-sm">{language === 'no' ? group.label_no : group.label_en}</span>
                                {selectedCount > 0 && (
                                  <span className="bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                                    {selectedCount}
                                  </span>
                                )}
                              </div>
                              <span className="text-gray-400 transition-transform group-open:rotate-180 text-xs">▼</span>
                            </summary>
                            <div className="p-3.5 pt-0 flex flex-wrap gap-2 border-t border-gray-200 dark:border-gray-700 mt-1">
                              {group.options.map((opt) => {
                                const isSelected = opt.id === -1 ? formData.hasBike : formData.attributes.includes(opt.id);
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => toggleAttribute(opt.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                                      isSelected
                                        ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-400 dark:hover:border-amber-500'
                                    }`}
                                  >
                                    {language === 'no' ? opt.label_no : opt.label_en}
                                  </button>
                                );
                              })}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.fullName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={language === 'no' ? 'Ditt fulle navn' : 'Your full name'}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.phone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={language === 'no' ? '+47 XXX XX XXX' : '+47 XXX XX XXX'}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.email} <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={language === 'no' ? 'Din epost (valgfritt)' : 'Your email (optional)'}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                {/* Additional Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.additionalInfo}
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    placeholder={t.specialRequests}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors resize-none"
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
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
                    {language === 'no'
                      ? 'Når en bil godkjenner turen, vil du få melding og mulighet for å spore bilen.'
                      : 'When a vehicle accepts your ride, you will receive a notification and the ability to track the vehicle.'}
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
              <p>{t.supportText}</p>
            </div>
          </div>
        )}

        {/* Status Check Tab */}
        {activeTab === 'status' && (
          <div className="w-full max-w-2xl">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                {t.bookingStatusTitle}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base max-w-2xl mx-auto">
                {language === 'no'
                  ? 'Skriv inn ditt bookingnummer for å sjekke status på turen.'
                  : 'Enter your booking number to check the status of your ride.'}
              </p>
            </div>

            {/* Show Booking Tracking if just booked */}
            {success && bookingNumber && (
              <BookingTracking
                bookingNumber={bookingNumber}
                language={language}
                pickupLocation={lastBookingPickup}
                dropoffLocation={lastBookingDropoff}
              />
            )}

            {/* Status Form Container */}
            {!success && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12">
              <form onSubmit={handleCheckStatus} className="space-y-6">
                {/* Booking Number Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.bookingNumber}
                  </label>
                  <input
                    type="text"
                    value={statusBookingNumber}
                    onChange={(e) => setStatusBookingNumber(e.target.value)}
                    placeholder={language === 'no' ? 'F.eks. BK-1234567' : 'e.g. BK-1234567'}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 transition-colors"
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
                        <span className="text-gray-600 dark:text-gray-400">{t.bookingNumber}:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{bookingStatus.bookingNumber}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-green-200">
                        <span className="text-gray-600 dark:text-gray-400">{t.status}:</span>
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
                          <span className="text-gray-600 dark:text-gray-400">{t.assignedVehicle}:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{bookingStatus.vehicle}</span>
                        </div>
                      )}
                      {bookingStatus.driver && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">{t.driver}:</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{bookingStatus.driver}</span>
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
