'use client';

import BookingForm from '@/components/BookingForm';

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500 rounded-full mix-blend-screen blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <BookingForm />
      </div>
    </main>
  );
}
