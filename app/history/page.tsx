'use client';

// app/history/page.tsx
import React, { useEffect, useState } from 'react';

interface BookingRecord {
  id: number;
  phone: string;
  bookingId: string;
  driverPhone: string;
  timestamp: number;
  status: string;
  vehicleLocation: string;
}

export default function HistoryPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to read cookie
  const getCookie = (name: string) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return null;
  };

  const fetchHistory = async () => {
    const phone = getCookie('bookingPhone');
    if (!phone) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/history?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    const phone = getCookie('bookingPhone');
    if (!phone) return;
    try {
      await fetch(`/api/history?phone=${encodeURIComponent(phone)}`, { method: 'DELETE' });
      setBookings([]);
    } catch (e) {
      console.error('Failed to delete history', e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Booking History</h1>
      {loading && <p>Laster...</p>}
      {bookings.length === 0 && !loading && <p>Ingen tidligere bestillinger funnet.</p>}
      {bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-gray-800 p-3 rounded">
              <p><strong>Booking ID:</strong> {b.bookingId}</p>
              <p><strong>Driver Phone:</strong> {b.driverPhone}</p>
              <p><strong>Status:</strong> {b.status}</p>
              <p><strong>Dato:</strong> {new Date(b.timestamp).toLocaleString()}</p>
            </div>
          ))}
          <button
            onClick={handleDelete}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            Slett historikk
          </button>
        </div>
      )}
    </div>
  );
}
