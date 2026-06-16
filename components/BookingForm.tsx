'use client';

import { useState } from 'react';
import { MapPin, Clock, Users, Car, Phone, Mail, MessageSquare, Search } from 'lucide-react';
import { useTranslation, type Language } from '@/lib/i18n';
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

  // Booking form state
  const [formData, setFormData] = useState<FormData>({
    pickupLocation: '',
    dropoffLocation: '',
    date: '',
    time: '',
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
    setFormData((prev) => ({
      ...prev,
      [field]: suggestion.address,
    }));
    if (field === 'pickupLocation') {
      setShowPickupSuggestions(false);
    } else {
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
      const response = await createBooking(formData);

      if (response.success) {
        setSuccess(true);
        setBookingNumber(response.bookingNumber);
        setFormData({
          pickupLocation: '',
          dropoffLocation: '',
          date: '',
          time: '',
          passengers: 1,
          carType: 'estatecar',
          name: '',
          phone: '',
          email: '',
          additionalInfo: '',
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
    <div className="relative z-20 min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 md:py-12">
      {/* Language Selector */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 flex gap-2">
        <button
          onClick={() => setLanguage('no')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            language === 'no'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          NO
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            language === 'en'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          EN
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2">
        <button
          onClick={() => setActiveTab('booking')}
          className={`px-6 py-3 rounded-full font-semibold transition-all ${
            activeTab === 'booking'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {language === 'no' ? 'Bestill' : 'Book'}
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`px-6 py-3 rounded-full font-semibold transition-all ${
            activeTab === 'status'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {t.checkStatus}
        </button>
      </div>

      {/* Booking Form Tab */}
      {activeTab === 'booking' && (
        <div className="w-full max-w-2xl animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
          {/* Header */}
          <div className="mb-8 text-center md:mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              {t.bookYourRide}
            </h1>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          {/* Main Form Container */}
          <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 shadow-2xl backdrop-blur-xl">
            {/* Inner Core */}
            <div className="p-6 md:p-10 rounded-[calc(2rem-0.375rem)] bg-slate-900/80 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                {/* Pickup & Dropoff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Pickup Location with Autocomplete */}
                  <div className="group relative animate-[slideInLeft_0.6s_ease-out_0.3s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 inline mr-2" />
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
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                      {showPickupSuggestions && pickupSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          {pickupSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                selectAddressSuggestion('pickupLocation', suggestion)
                              }
                              className="w-full px-4 py-2 text-left hover:bg-slate-700 text-sm text-white border-b border-slate-700 last:border-b-0"
                            >
                              <div className="font-semibold">{suggestion.name}</div>
                              <div className="text-xs text-slate-400">
                                {suggestion.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropoff Location with Autocomplete */}
                  <div className="group relative animate-[slideInRight_0.6s_ease-out_0.3s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 inline mr-2" />
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
                        className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                      />
                      {showDropoffSuggestions &&
                        dropoffSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                            {dropoffSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  selectAddressSuggestion(
                                    'dropoffLocation',
                                    suggestion
                                  )
                                }
                                className="w-full px-4 py-2 text-left hover:bg-slate-700 text-sm text-white border-b border-slate-700 last:border-b-0"
                              >
                                <div className="font-semibold">
                                  {suggestion.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {suggestion.address}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="group animate-[slideInLeft_0.6s_ease-out_0.4s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      <Clock className="w-4 h-4 inline mr-2" />
                      {t.date}
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                  </div>

                  <div className="group animate-[slideInRight_0.6s_ease-out_0.4s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      <Clock className="w-4 h-4 inline mr-2" />
                      {t.time}
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Passengers & Car Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="group animate-[slideInLeft_0.6s_ease-out_0.5s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      <Users className="w-4 h-4 inline mr-2" />
                      {t.passengers}
                    </label>
                    <select
                      name="passengers"
                      value={formData.passengers}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} {language === 'no' ? (num === 1 ? 'Passasjer' : 'Passasjerer') : num === 1 ? 'Passenger' : 'Passengers'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Car Type Selection */}
                  <div className="animate-[slideInRight_0.6s_ease-out_0.5s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      <Car className="w-4 h-4 inline mr-2" />
                      {t.vehicleType}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {CAR_TYPES.map((car) => (
                        <button
                          key={car.value}
                          type="button"
                          onClick={() => handleCarTypeChange(car.value)}
                          className={`flex-1 min-w-20 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                            formData.carType === car.value
                              ? 'bg-blue-500 text-white ring-2 ring-blue-500/50'
                              : 'bg-slate-800/50 text-slate-300 border border-white/10 hover:border-blue-500/30'
                          }`}
                        >
                          {car.icon} {language === 'no' ? car.label_no : car.label_en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="group animate-[slideInLeft_0.6s_ease-out_0.6s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      {t.fullName}
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={language === 'no' ? 'Ditt fulle navn' : 'Your full name'}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                  </div>

                  <div className="group animate-[slideInRight_0.6s_ease-out_0.6s_both]">
                    <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                      <Phone className="w-4 h-4 inline mr-2" />
                      {t.phone}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={language === 'no' ? '+47 XXX XX XXX' : '+47 XXX XX XXX'}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="group animate-[slideInLeft_0.6s_ease-out_0.65s_both]">
                  <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                    <Mail className="w-4 h-4 inline mr-2" />
                    {t.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={language === 'no' ? 'Din epost' : 'Your email'}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>

                {/* Additional Info */}
                <div className="animate-[slideInUp_0.6s_ease-out_0.7s_both]">
                  <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-2 md:mb-3 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    {t.additionalInfo}
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    placeholder={t.specialRequests}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="animate-[slideInUp_0.6s_ease-out_0.8s_both] pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full px-6 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-2xl hover:shadow-blue-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between relative overflow-hidden text-sm md:text-base"
                  >
                    <span className="relative z-10">
                      {loading ? t.booking : t.confirmBooking}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-300">
                      <span className="text-white text-sm">→</span>
                    </div>
                  </button>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="animate-[slideInUp_0.4s_ease-out] p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center font-semibold text-sm md:text-base">
                    <div>{t.bookingConfirmed}</div>
                    {bookingNumber && (
                      <div className="text-xs md:text-sm mt-2">
                        {language === 'no' ? 'Bookingnummer' : 'Booking Number'}: <span className="font-mono">{bookingNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="animate-[slideInUp_0.4s_ease-out] p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-semibold text-sm md:text-base">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 md:mt-12 text-center text-slate-400 text-xs md:text-sm animate-[fadeIn_1s_ease-out_1s_both]">
            <p>{t.supportText}</p>
          </div>
        </div>
      )}

      {/* Status Check Tab */}
      {activeTab === 'status' && (
        <div className="w-full max-w-2xl animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
          {/* Header */}
          <div className="mb-8 text-center md:mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
              {t.bookingStatusTitle}
            </h1>
            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
              {language === 'no'
                ? 'Skriv inn ditt bookingnummer for å sjekke status på turen.'
                : 'Enter your booking number to check the status of your ride.'}
            </p>
          </div>

          {/* Status Form Container */}
          <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="p-6 md:p-10 rounded-[calc(2rem-0.375rem)] bg-slate-900/80 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <form onSubmit={handleCheckStatus} className="space-y-6">
                {/* Booking Number Input */}
                <div className="group">
                  <label className="block text-xs md:text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <Search className="w-4 h-4 inline mr-2" />
                    {t.bookingNumber}
                  </label>
                  <input
                    type="text"
                    value={statusBookingNumber}
                    onChange={(e) => setStatusBookingNumber(e.target.value)}
                    placeholder={language === 'no' ? 'F.eks. BK-1234567' : 'e.g. BK-1234567'}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 text-sm md:text-base focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="group w-full px-6 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold uppercase tracking-wider transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between relative text-sm md:text-base"
                >
                  <span>{statusLoading ? language === 'no' ? 'Søker...' : 'Searching...' : t.searchBooking}</span>
                  <Search className="w-5 h-5" />
                </button>

                {/* Status Display */}
                {bookingStatus && (
                  <div className="animate-[slideInUp_0.4s_ease-out] p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-4">
                    <h3 className="text-lg md:text-xl font-bold text-white">{t.bookingFound}</h3>
                    <div className="space-y-3 text-sm md:text-base">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">{t.bookingNumber}:</span>
                        <span className="text-white font-semibold">{bookingStatus.bookingNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">{t.status}:</span>
                        <span className="text-green-400 font-semibold">
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
                        <div className="flex justify-between items-center">
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
                )}

                {/* Error Message */}
                {statusError && (
                  <div className="animate-[slideInUp_0.4s_ease-out] p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-semibold text-sm md:text-base">
                    {statusError}
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
