'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, MessageSquare } from 'lucide-react';
import { getCarDetails } from '@/lib/cars';

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
  vehicleLat?: number;
  vehicleLon?: number;
  driverName?: string;
  activeVehicleMobile?: string;
  licenseNo?: string;
  gpsVelocity?: number;
  gpsDirection?: number;
  activeTrip?: string;
  vehicleType?: string;
  regNo?: string;
  eta?: number; // minutes
}

export default function TrackingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingNumber = params.id as string;
  const lang = (searchParams?.get('lang') as 'no' | 'en') || 'no';

  const t = {
    no: {
      back: 'Tilbake til bestilling',
      tracking: 'Turoversikt',
      status: 'Status',
      driverAccepted: '🚗 Sjåfør akseptert! Kjøretøy er på vei',
      inProgress: '⏳ Tur i gang',
      completed: '✅ Tur fullført',
      waiting: '⏰ Venter på sjåfør...',
      loadingMap: 'Laster kart...',
      vehicleInfo: 'Kjøretøyinfo',
      numberPlate: 'Skiltnummer',
      vehicleType: 'Biltype',
      speed: 'Fart',
      eta: 'Ankomst',
      pickup: 'Hentested',
      destination: 'Destinasjon',
      callDriver: 'Ring sjåfør',
      regNo: 'Reg.nr',
      licenseNo: 'Løyvenr',
      carModel: 'Bilmerke',
      message: 'Melding'
    },
    en: {
      back: 'Back to Booking',
      tracking: 'Trip Tracking',
      status: 'Status',
      driverAccepted: '🚗 Driver accepted! Vehicle is on the way',
      inProgress: '⏳ In progress',
      completed: '✅ Completed',
      waiting: '⏰ Waiting for driver...',
      loadingMap: 'Loading map...',
      vehicleInfo: 'Vehicle Info',
      numberPlate: 'Number Plate',
      vehicleType: 'Vehicle Type',
      speed: 'Speed',
      eta: 'ETA',
      pickup: 'Pickup',
      destination: 'Destination',
      callDriver: 'Call Driver',
      regNo: 'Reg. No',
      licenseNo: 'License No',
      carModel: 'Car Model',
      message: 'Message'
    }
  }[lang];

  const [status, setStatus] = useState<BookingStatus | null>(null);
  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [etaDropoff, setEtaDropoff] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const vehicleMarkerRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);

  // Initialize map (using OpenStreetMap/Leaflet via CDN)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
      script.onload = () => {
        initMap();
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      const L = (window as any).L;
      if (!mapContainerRef.current) return;

      // Initialize map
      const map = L.map(mapContainerRef.current).setView([60.5627, 6.4227], 13);
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    }
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
          const L = (window as any).L;

          // First load logic - fit all points in view
          if (mapRef.current && !mapRef.current.hasSetInitialCenter) {
            const bounds = L.latLngBounds();
            let hasPoints = false;

            if (locationData.vehicleLat && locationData.vehicleLon) {
              bounds.extend([locationData.vehicleLat, locationData.vehicleLon]);
              hasPoints = true;
            }
            if (locationData.pickupLat && locationData.pickupLon) {
              bounds.extend([locationData.pickupLat, locationData.pickupLon]);
              hasPoints = true;
            }
            if (locationData.destLat && locationData.destLon) {
              bounds.extend([locationData.destLat, locationData.destLon]);
              hasPoints = true;
            }

            if (hasPoints) {
              mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
              mapRef.current.hasSetInitialCenter = true;
            }
          }

          // Draw pickup location
          if (mapRef.current && locationData.pickupLat && locationData.pickupLon) {
            updatePickupMarker(locationData.pickupLat, locationData.pickupLon);
          }

          // Draw destination location
          if (mapRef.current && locationData.destLat && locationData.destLon) {
            updateDestMarker(locationData.destLat, locationData.destLon);
          }

          // Draw vehicle marker
          if (mapRef.current && locationData.vehicleLat && locationData.vehicleLon) {
            updateVehicleMarker(
              locationData.vehicleLat,
              locationData.vehicleLon,
              locationData.gpsDirection || 0,
              locationData.licenseNo || 'Taxi'
            );
          } else if (mapRef.current && locationData.pickupLat && locationData.pickupLon && !vehicleMarkerRef.current) {
             // Fallback: center map on pickup if no vehicle location
             mapRef.current.setView([locationData.pickupLat, locationData.pickupLon], 13);
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

  // Fetch OSRM ETA to dropoff
  useEffect(() => {
    if (location?.vehicleLat && location?.vehicleLon && location?.destLat && location?.destLon) {
      fetch(`https://router.project-osrm.org/route/v1/driving/${location.vehicleLon},${location.vehicleLat};${location.destLon},${location.destLat}?overview=false`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            setEtaDropoff(Math.ceil(data.routes[0].duration / 60)); // duration in minutes
          }
        })
        .catch(err => console.error("Failed to fetch OSRM ETA:", err));
    }
  }, [location?.vehicleLat, location?.vehicleLon, location?.destLat, location?.destLon]);

  const updatePickupMarker = (lat: number, lon: number) => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = L.marker([lat, lon], {
        title: 'Hentested',
        opacity: 0.8,
      }).addTo(mapRef.current).bindPopup('<b>Hentested</b>');
    } else {
      pickupMarkerRef.current.setLatLng([lat, lon]);
    }
  };

  const updateDestMarker = (lat: number, lon: number) => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!destMarkerRef.current) {
      // Create a red icon for destination using emoji
      const redIcon = L.divIcon({
        html: `<div style="font-size: 24px; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid #ef4444;">📍</div>`,
        className: 'custom-dest-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
      });

      destMarkerRef.current = L.marker([lat, lon], {
        icon: redIcon,
        title: 'Destinasjon',
        opacity: 0.8,
      }).addTo(mapRef.current).bindPopup('<b>Destinasjon</b>');
    } else {
      destMarkerRef.current.setLatLng([lat, lon]);
    }
  };

  const updateVehicleMarker = (lat: number, lon: number, direction: number, label: string) => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Create custom taxi icon
    const taxiIcon = L.divIcon({
      html: `<div style="font-size: 24px; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid #f59e0b;">🚕</div>`,
      className: 'custom-taxi-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (vehicleMarkerRef.current) {
      // Update existing marker
      vehicleMarkerRef.current.setLatLng([lat, lon]);
      vehicleMarkerRef.current.setIcon(taxiIcon);
    } else {
      // Add new marker
      vehicleMarkerRef.current = L.marker([lat, lon], {
        icon: taxiIcon,
        title: label,
        opacity: 1,
        zIndexOffset: 1000 // Ensure car is above pickup pin
      })
        .addTo(mapRef.current)
        .bindPopup(`<b>${label}</b><br/>${Math.round((location?.gpsVelocity || 0) / 10)} km/h`);
    }

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
                onClick={() => router.push('/')}
                className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <div className="p-2 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-medium">{t.back}</span>
              </button>
              <div>
                <div className="text-xs text-slate-400 uppercase">{t.tracking}</div>
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
                {status.status === 'accepted' && t.driverAccepted}
                {status.status === 'inProgress' && t.inProgress}
                {status.status === 'completed' && t.completed}
                {status.status === 'pending' && t.waiting}
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
                  <div className="text-slate-400">{t.loadingMap}</div>
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
                  {t.vehicleInfo}
                </div>
                <div className="space-y-3">
                  {location.licenseNo && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">{t.licenseNo}</div>
                      <div className="text-lg font-semibold text-white">
                        {location.licenseNo}
                      </div>
                    </div>
                  )}
                  {location.regNo && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">{t.regNo}</div>
                      <div className="text-lg font-semibold text-white">
                        {location.regNo}
                      </div>
                    </div>
                  )}
                  {location.licenseNo && getCarDetails(location.licenseNo) && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">{t.carModel}</div>
                      <div className="text-lg font-semibold text-white">
                        {getCarDetails(location.licenseNo)?.model} ({getCarDetails(location.licenseNo)?.color})
                      </div>
                    </div>
                  )}
                  {location.vehicleType && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">{t.vehicleType}</div>
                      <div className="text-lg font-semibold text-white">
                        {location.vehicleType}
                      </div>
                    </div>
                  )}
                  {location.gpsVelocity !== undefined && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">{t.speed}</div>
                      <div className="text-lg font-semibold text-white">
                        {Math.round(location.gpsVelocity / 10)} km/h
                      </div>
                    </div>
                  )}
                  {location.eta !== undefined && (
                    <div>
                      <div className="text-sm text-slate-400 mb-1">{t.eta}</div>
                      <div className="text-2xl font-bold text-green-400">
                        {location.eta} min
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Pickup/Dropoff */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-xl space-y-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-green-400" />
                  {t.pickup}
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
                  {t.destination}
                </div>
                {location?.destLat && location?.destLon && (
                  <div className="text-sm text-slate-300">
                    {location.destLat.toFixed(4)}, {location.destLon.toFixed(4)}
                  </div>
                )}
              </div>
              {etaDropoff !== null && (
                <div className="pt-2 border-t border-slate-700/50 mt-4">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    {lang === 'en' ? 'Est. Time to Dropoff' : 'Est. tid til levering'}
                  </div>
                  <div className="text-xl font-bold text-blue-400">
                    ~{etaDropoff} min
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <a 
                href={`tel:${location?.activeVehicleMobile ? '+47' + location.activeVehicleMobile.replace(/\s+/g, '') : '+4756511340'}`}
                className="w-full px-4 py-3 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/50 font-semibold hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                {t.callDriver} ({location?.activeVehicleMobile || '+47 56 51 13 40'})
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
