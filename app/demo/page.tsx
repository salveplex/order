'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Phone, MessageSquare, Navigation } from 'lucide-react';
import Link from 'next/link';

export default function TrackingDemo() {
  const [location, setLocation] = useState({
    lat: 60.5627,
    lon: 6.4227,
    speed: 0,
    direction: 0,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Simulate taxi movement
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      // Simulate taxi moving from pickup to dropoff
      const progress = (frame % 200) / 200; // 0 to 1

      // Interpolate between pickup and dropoff
      const startLat = 60.5627;
      const startLon = 6.4227;
      const endLat = 60.5637;
      const endLon = 6.4189;

      setLocation({
        lat: startLat + (endLat - startLat) * progress,
        lon: startLon + (endLon - startLon) * progress,
        speed: Math.sin(progress * Math.PI) * 40, // 0-40 km/h
        direction: 45 + progress * 90, // Direction changes
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current) return;

      // Dynamically load Leaflet
      const L = await import('leaflet');

      // Create map
      const map = L.map(mapContainerRef.current).setView([60.5627, 6.4227], 15);
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Add pickup marker (green)
      L.marker([60.5627, 6.4227], {
        title: 'Pickup Point',
      })
        .addTo(map)
        .bindPopup('<b>Voss Stasjon</b><br/>Pickup Point')
        .setIcon(
          L.icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          })
        );

      // Add dropoff marker (red)
      L.marker([60.5637, 6.4189], {
        title: 'Dropoff Point',
      })
        .addTo(map)
        .bindPopup('<b>Voss Sjukehus</b><br/>Dropoff Point')
        .setIcon(
          L.icon({
            iconUrl:
              'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          })
        );
    };

    initMap();
  }, []);

  // Update taxi marker
  useEffect(() => {
    const updateMarker = async () => {
      if (!mapRef.current) return;

      const L = await import('leaflet');

      // Remove old marker
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }

      // Add taxi marker
      const marker = L.marker([location.lat, location.lon], {
        title: 'R166 - Taxi',
        icon: L.icon({
          iconUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        }),
      })
        .addTo(mapRef.current)
        .bindPopup(
          `<b>R166</b><br/>Speed: ${Math.round(location.speed)} km/h<br/>Driver: Ole Hansen`
        );

      markerRef.current = marker;

      // Center map on taxi
      mapRef.current.setView([location.lat, location.lon], 15);
    };

    updateMarker();
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <div className="text-xs text-slate-400 uppercase">Demo Booking</div>
                <div className="text-lg font-mono text-blue-400">BEM260</div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500/20 text-green-400">
              🚗 On the way
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div
              ref={mapContainerRef}
              className="w-full h-[400px] md:h-[600px] rounded-2xl bg-slate-800 border border-slate-700/50 overflow-hidden shadow-2xl"
            />
            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-sm text-slate-300">
              <div className="text-xs text-slate-400 mb-2">🗺️ Live Tracking Demo</div>
              <p>
                🟢 Green = Pickup (Voss Stasjon) | 🔴 Red = Dropoff (Voss Sjukehus) | 🔵
                Blue = Your Taxi (R166)
              </p>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* Vehicle Info */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-xl shadow-xl">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-400" />
                Vehicle Info
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Vehicle</div>
                  <div className="text-lg font-semibold text-white">R166</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Speed</div>
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(location.speed)} km/h
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Direction</div>
                  <div className="text-lg text-slate-300">
                    {Math.round(location.direction)}°
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-xl shadow-xl">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-4">
                Driver
              </div>
              <div>
                <div className="text-lg font-semibold text-white mb-1">Ole Hansen</div>
                <div className="text-sm text-slate-400">Experience: 12 years</div>
              </div>
            </div>

            {/* Locations */}
            <div className="rounded-2xl bg-slate-900/50 border border-slate-700/50 p-6 backdrop-blur-xl shadow-xl space-y-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-green-400" />
                  Pickup
                </div>
                <div className="text-sm text-slate-300">Voss Stasjon</div>
                <div className="text-xs text-slate-500 mt-1">60.5627, 6.4227</div>
              </div>
              <div className="border-t border-slate-700/50 pt-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-red-400" />
                  Destination
                </div>
                <div className="text-sm text-slate-300">Voss Sjukehus</div>
                <div className="text-xs text-slate-500 mt-1">60.5637, 6.4189</div>
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

            {/* Status */}
            <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 p-4 text-center">
              <div className="text-sm font-semibold text-green-400">✅ Driver Accepted</div>
              <div className="text-xs text-slate-400 mt-1">ETA: 3 minutes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
