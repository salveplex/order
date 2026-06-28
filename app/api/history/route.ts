// app/api/history/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, bookingId, driverPhone, status, vehicleLocation } = body;
    const timestamp = Date.now();
    const stmt = db.prepare(`INSERT INTO bookings (phone, bookingId, driverPhone, timestamp, status, vehicleLocation)
                            VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(phone, bookingId, driverPhone || null, timestamp, status || null, vehicleLocation || null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History POST error', error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ error: 'Missing phone parameter' }, { status: 400 });
    }
    const rows = db.prepare('SELECT * FROM bookings WHERE phone = ? ORDER BY timestamp DESC').all(phone);
    return NextResponse.json({ bookings: rows });
  } catch (error) {
    console.error('History GET error', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ error: 'Missing phone parameter' }, { status: 400 });
    }
    const stmt = db.prepare('DELETE FROM bookings WHERE phone = ?');
    stmt.run(phone);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('History DELETE error', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
