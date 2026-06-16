'use client';

import { useState } from 'react';
import { MapPin, Clock, Users, Car, Phone, MessageSquare } from 'lucide-react';

type CarType = 'sedan' | 'six-seater' | 'eight-seater' | 'wheelchair';

interface FormData {
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  passengers: number;
  carType: CarType;
  name: string;
  phone: string;
  additionalInfo: string;
}

const CAR_TYPES: { value: CarType; label: string; icon: string }[] = [
  { value: 'sedan', label: 'Sedan', icon: '🚗' },
  { value: 'six-seater', label: '6-Seater', icon: '🚙' },
  { value: 'eight-seater', label: '8-Seater', icon: '🚐' },
  { value: 'wheelchair', label: 'Wheelchair Accessible', icon: '♿' },
];

export default function BookingForm() {
  const [formData, setFormData] = useState<FormData>({
    pickupLocation: '',
    dropoffLocation: '',
    date: '',
    time: '',
    passengers: 1,
    carType: 'sedan',
    name: '',
    phone: '',
    additionalInfo: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

    try {
      // TODO: Integrate with Taxi4U API
      console.log('Booking data:', formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          pickupLocation: '',
          dropoffLocation: '',
          date: '',
          time: '',
          passengers: 1,
          carType: 'sedan',
          name: '',
          phone: '',
          additionalInfo: '',
        });
      }, 2000);
    } catch (error) {
      console.error('Booking failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-20 min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 md:py-24">
      {/* Header */}
      <div className="mb-12 text-center animate-[fadeInDown_0.8s_ease-out]">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Premium Taxi Booking
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
          Book Your Ride
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Fast, reliable, and professional taxi service at your fingertips
        </p>
      </div>

      {/* Main Form Container - Double Bezel Architecture */}
      <div className="w-full max-w-2xl animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
        {/* Outer Shell */}
        <div className="p-1.5 rounded-[2rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 shadow-2xl backdrop-blur-xl">
          {/* Inner Core */}
          <div className="p-8 md:p-10 rounded-[calc(2rem-0.375rem)] bg-slate-900/80 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Pickup & Dropoff - Asymmetrical Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Location */}
                <div className="group md:col-span-1 animate-[slideInLeft_0.6s_ease-out_0.3s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    name="pickupLocation"
                    value={formData.pickupLocation}
                    onChange={handleInputChange}
                    placeholder="Enter pickup address"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>

                {/* Dropoff Location */}
                <div className="group md:col-span-1 animate-[slideInRight_0.6s_ease-out_0.3s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Dropoff Location
                  </label>
                  <input
                    type="text"
                    name="dropoffLocation"
                    value={formData.dropoffLocation}
                    onChange={handleInputChange}
                    placeholder="Enter destination"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div className="group animate-[slideInLeft_0.6s_ease-out_0.4s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>

                {/* Time */}
                <div className="group animate-[slideInRight_0.6s_ease-out_0.4s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Passengers & Car Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Passengers */}
                <div className="group animate-[slideInLeft_0.6s_ease-out_0.5s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <Users className="w-4 h-4 inline mr-2" />
                    Passengers
                  </label>
                  <select
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Passenger' : 'Passengers'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Car Type Selection */}
                <div className="animate-[slideInRight_0.6s_ease-out_0.5s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <Car className="w-4 h-4 inline mr-2" />
                    Vehicle Type
                  </label>
                  <div className="flex gap-2">
                    {CAR_TYPES.map((car) => (
                      <button
                        key={car.value}
                        type="button"
                        onClick={() => handleCarTypeChange(car.value)}
                        className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                          formData.carType === car.value
                            ? 'bg-blue-500 text-white ring-2 ring-blue-500/50'
                            : 'bg-slate-800/50 text-slate-300 border border-white/10 hover:border-blue-500/30'
                        }`}
                      >
                        {car.icon} {car.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="group animate-[slideInLeft_0.6s_ease-out_0.6s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>

                {/* Phone */}
                <div className="group animate-[slideInRight_0.6s_ease-out_0.6s_both]">
                  <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+47 XXXX XXXX"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="animate-[slideInUp_0.6s_ease-out_0.7s_both]">
                <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Additional Information
                </label>
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 resize-none"
                />
              </div>

              {/* Submit Button - Button-in-Button Pattern */}
              <div className="animate-[slideInUp_0.6s_ease-out_0.8s_both] pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full px-6 py-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold uppercase tracking-wider transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-2xl hover:shadow-blue-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between relative overflow-hidden"
                >
                  <span className="relative z-10">{loading ? 'Booking...' : 'Confirm Booking'}</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 transition-transform duration-300">
                    <span className="text-white text-sm">→</span>
                  </div>
                </button>
              </div>

              {/* Success Message */}
              {success && (
                <div className="animate-[slideInUp_0.4s_ease-out] p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center font-semibold">
                  ✓ Booking confirmed! Check your email for details.
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-slate-400 text-sm animate-[fadeIn_1s_ease-out_1s_both]">
        <p>24/7 Customer Support • Secure Payment • Professional Drivers</p>
      </div>
    </div>
  );
}
