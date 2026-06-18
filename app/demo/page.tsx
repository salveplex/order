'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Phone, MessageSquare, Navigation } from 'lucide-react';
import Link from 'next/link';

export default function TrackingDemo() {
  const [location, setLocation] = useState({
    lat: 60.6591760,
    lon: 6.4209200,
    speed: 0,
    direction: 0,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<Array<[number, number]>>([
    [60.6591760, 6.4209200], // Grevlesvegen 22
    [60.6281914, 6.4222631], // Uttrågata 19 (fallback)
  ]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Fetch actual route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      try {
        // Grevlesvegen 22 and Uttrågata 19 in Voss, Norway
        const startLat = 60.6591760;
        const startLon = 6.4209200;
        const endLat = 60.6281914;
        const endLon = 6.4222631;

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/car/${startLon},${startLat};${endLon},${endLat}?geometries=geojson&overview=full`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]] // Convert from [lon, lat] to [lat, lon]
            );
            setRouteCoordinates(coords);
          }
        }
      } catch (error) {
        console.log('Route fetch failed, using fallback route');
      }
    };

    fetchRoute();
  }, []);

  // Simulate taxi movement along route
  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      const cycleLength = 300; // Total frames for one complete journey
      const progress = (frame % cycleLength) / cycleLength; // 0 to 1

      // Interpolate along the entire route
      const totalDistance = routeCoordinates.length - 1;
      const distanceAlongRoute = progress * totalDistance;
      const segmentIndex = Math.floor(distanceAlongRoute);
      const segmentProgress = distanceAlongRoute - segmentIndex;

      // Clamp to valid range
      const currentSegmentIndex = Math.min(segmentIndex, routeCoordinates.length - 2);
      const nextSegmentIndex = Math.min(currentSegmentIndex + 1, routeCoordinates.length - 1);

      const [currentLat, currentLon] = routeCoordinates[currentSegmentIndex];
      const [nextLat, nextLon] = routeCoordinates[nextSegmentIndex];

      // Interpolate position
      const interpolatedLat = currentLat + (nextLat - currentLat) * segmentProgress;
      const interpolatedLon = currentLon + (nextLon - currentLon) * segmentProgress;

      // Calculate direction based on movement
      const dLat = nextLat - currentLat;
      const dLon = nextLon - currentLon;
      const direction = Math.atan2(dLon, dLat) * (180 / Math.PI);

      setLocation({
        lat: interpolatedLat,
        lon: interpolatedLon,
        speed: Math.sin(progress * Math.PI) * 40, // 0-40 km/h
        direction: direction,
      });
    }, 500);

    return () => clearInterval(interval);
  }, [routeCoordinates]);

  // Initialize map via CDN
  useEffect(() => {
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

      // Create map centered between the two locations
      const map = L.map(mapContainerRef.current).setView([60.6437, 6.4216], 13);
      mapRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Custom pickup marker (house + "Henting")
      const pickupMarker = L.divIcon({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center;">
            <div style="font-size: 28px; line-height: 1;">🏠</div>
            <div style="background: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; color: #10b981; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Henting</div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 45],
        popupAnchor: [0, -45],
        className: '',
      });
      L.marker([60.6591760, 6.4209200], { title: 'Pickup Point', icon: pickupMarker })
        .addTo(map)
        .bindPopup('<b>Grevlesvegen 22</b><br/>Hentested');

      // Custom dropoff marker (house + "Levering")
      const dropoffMarker = L.divIcon({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center;">
            <div style="font-size: 28px; line-height: 1;">🏠</div>
            <div style="background: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; color: #ef4444; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Levering</div>
          </div>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 45],
        popupAnchor: [0, -45],
        className: '',
      });
      L.marker([60.6281914, 6.4222631], { title: 'Dropoff Point', icon: dropoffMarker })
        .addTo(map)
        .bindPopup('<b>Uttrågata 19</b><br/>Destinasjon');
    }
  }, []);


  // Update taxi marker
  useEffect(() => {
    const L = (window as any).L;
    if (!mapRef.current || !L) return;

    // Remove old marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    // Custom taxi marker with car and direction arrow
    const taxiIcon = L.divIcon({
      html: `
        <div style="display: flex; align-items: center; gap: 4px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <div style="font-size: 28px;">🚕</div>
          <div style="font-size: 20px; transform: rotate(${location.direction}deg);">→</div>
        </div>
      `,
      iconSize: [60, 32],
      iconAnchor: [30, 16],
      popupAnchor: [0, -16],
      className: '',
    });

    // Add taxi marker
    const marker = L.marker([location.lat, location.lon], {
      title: 'R166 - Taxi',
      icon: taxiIcon,
    })
      .addTo(mapRef.current)
      .bindPopup(
        `<b>R166</b><br/>Speed: ${Math.round(location.speed)} km/h<br/>Driver: Ole Hansen`
      );

    markerRef.current = marker;

    // Center map on taxi
    mapRef.current.setView([location.lat, location.lon], 15);
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
                <div className="text-sm text-slate-300">Grevlesvegen 22</div>
                <div className="text-xs text-slate-500 mt-1">60.6592, 6.4209</div>
              </div>
              <div className="border-t border-slate-700/50 pt-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-red-400" />
                  Destination
                </div>
                <div className="text-sm text-slate-300">Uttrågata 19</div>
                <div className="text-xs text-slate-500 mt-1">60.6282, 6.4223</div>
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
