'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, MessageSquare } from 'lucide-react';

interface BookingStatus {
  status: 'pending' | 'accepted' | 'inProgress' | 'completed';
  vehicle?: string;
  driver?: string;
  found: boolean;
}

interface VehicleLocation {
  pickupLat?: number;
  pickupLon?: number;
  destLat?: number;
  destLon?: number;
  driverName?: string;
  licenseNo?: string;
  gpsVelocity?: number;
  gpsDirection?: number;
  activeTrip?: string;
}

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingNumber = params.id as string;

  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize map (using OpenStreetMap/Leaflet)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      if (!mapContainerRef.current) return;

      // Initialize map (Voss, Norway as default center)
      const map = L.map(mapContainerRef.current).setView([60.5627, 6.4227], 13);
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add custom CSS for map
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    });
  }, []);

  // Fetch booking status and vehicle location
  useEffect(() => {
    if (!bookingNumber) return;

    const fetchData = async () => {
      try {
        const [statusRes, locationRes] = await Promise.all([
          fetch(`/api/bookings/status?id=${encodeURIComponent(bookingNumber)}`),
          fetch(`/api/vehicle/location?bookRef=${encodeURIComponent(bookingNumber)}`),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setStatus(statusData);
        }

        if (locationRes.ok) {
          const locationData = await locationRes.json();
          setLocation(locationData);

          // Update map marker
          if (mapRef.current && locationData.pickupLat && locationData.pickupLon) {
            updateMapMarker(
              locationData.pickupLat,
              locationData.pickupLon,
              locationData.gpsDirection || 0,
              locationData.licenseNo || 'Taxi'
            );
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tracking data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [bookingNumber]);

  const updateMapMarker = async (lat: number, lon: number, direction: number, label: string) => {
    if (!mapRef.current) return;

    // Dynamically import Leaflet
    const L = await import('leaflet');

    // Remove old marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    const marker = L.marker([lat, lon], {
      title: label,
      opacity: 1,
    })
      .addTo(mapRef.current)
      .bindPopup(`<b>${label}</b><br/>Moving at ${Math.round(location?.gpsVelocity || 0)} km/h`);

    markerRef.current = marker;

    // Center map on car
    mapRef.current.setView([lat, lon], 15);
  };

  if (!bookingNumber) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">Booking ID not found</div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <div className="text-xs text-slate-400 uppercase">Booking</div>
                <div className="text-lg font-mono text-blue-400">{bookingNumber}</div>
              </div>
            </div>

            {/* Status Badge */}
            {status && (
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                status.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                status.status === 'inProgress' ? 'bg-blue-500/20 text-blue-400' :
                status.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {status.status === 'accepted' && '🚗 On the way'}
                {status.status === 'inProgress' && '⏳ In progress'}
                {status.status === 'completed' && '✅ Completed'}
                {status.status === 'pending' && '⏰ Waiting'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div
              ref={mapContainerRef}
              className="w-full h-[400px] md:h-[600px] rounded-2xl bg-slate-800 border border-slate-700/50 overflow-hidden"
              style={{ minHeight: '400px' }}
            >
              {loading && (
                <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                  <div className="text-slate-400">Loading map...</div>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Vehicle Info */}
            {location && status?.status === 'accepted' && (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-xl">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">
                  Vehicle Info
                </div>
                <div className="space-y-3">
                  {location.licenseNo && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Vehicle</div>
                      <div className="text-lg font-semibold text-white">
                        {location.licenseNo}
                      </div>
                    </div>
                  )}
                  {location.gpsVelocity !== undefined && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Speed</div>
                      <div className="text-lg font-semibold text-white">
                        {Math.round(location.gpsVelocity)} km/h
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Driver Info */}
            {location && location.driverName && (
              <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-xl">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">
                  Driver
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold text-white">
                    {location.driverName}
                  </div>
                </div>
              </div>
            )}

            {/* Pickup/Dropoff */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-xl space-y-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-green-400" />
                  Pickup
                </div>
                {location?.pickupLat && location?.pickupLon && (
                  <div className="text-sm text-slate-300">
                    {location.pickupLat.toFixed(4)}, {location.pickupLon.toFixed(4)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-red-400" />
                  Destination
                </div>
                {location?.destLat && location?.destLon && (
                  <div className="text-sm text-slate-300">
                    {location.destLat.toFixed(4)}, {location.destLon.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full px-4 py-3 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 font-semibold hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
                Call Driver
              </button>
              <button className="w-full px-4 py-3 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/50 font-semibold hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
