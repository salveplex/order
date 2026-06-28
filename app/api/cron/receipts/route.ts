import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import db from '@/lib/db';
import { getAuthToken } from '@/lib/taxi4u-api';

const API_BASE = 'https://api.taxi4u.cab';

export async function GET(request: Request) {
  try {
    // 1. Get all pending receipt requests
    const stmt = db.prepare(`SELECT * FROM receipt_requests WHERE status = 'pending'`);
    const pendingRequests = stmt.all() as {
      id: number;
      bookingId: string;
      email: string;
      status: string;
      timestamp: number;
    }[];

    if (pendingRequests.length === 0) {
      return NextResponse.json({ message: 'No pending receipts' });
    }

    const authToken = await getAuthToken();
    let processed = 0;
    let sent = 0;

    // Set up nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    for (const req of pendingRequests) {
      processed++;
      try {
        // We use centralCode=VS, you might want this configurable
        const centralCode = 'VS';
        const url = `${API_BASE}/api/receipt?centralCode=${centralCode}&bookRef=${req.bookingId}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.status === 404) {
          // Trip not completed or receipt not ready yet
          console.log(`Receipt not ready yet for booking: ${req.bookingId}`);
          continue;
        }

        if (!response.ok) {
          console.error(`Error fetching receipt for ${req.bookingId}: ${response.status}`);
          continue;
        }

        const receiptData = await response.json();
        
        // Build an elegant HTML email
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f59e0b;">
              <h1 style="margin: 0; color: #1f2937;">Voss Taxi</h1>
              <p style="margin: 5px 0; color: #6b7280;">Kvittering for din tur</p>
            </div>
            
            <div style="padding: 20px 0;">
              <p>Takk for at du reiste med oss!</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Dato for tur:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${new Date(receiptData.startDateTime).toLocaleDateString('no-NO')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Bookingnummer:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${receiptData.bookRef || req.bookingId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fra:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${receiptData.fromAddress || 'Ikke oppgitt'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Til:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${receiptData.toAddress || 'Ikke oppgitt'}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Distanse:</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${receiptData.km} km</td>
                </tr>
              </table>

              <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px; color: #6b7280;">Pris uten MVA:</td>
                  <td style="padding: 15px; text-align: right;">${receiptData.vatBasis?.toFixed(2)} kr</td>
                </tr>
                <tr>
                  <td style="padding: 15px; color: #6b7280;">MVA (${receiptData.vatPercentage}%):</td>
                  <td style="padding: 15px; text-align: right;">${receiptData.vat?.toFixed(2)} kr</td>
                </tr>
                <tr>
                  <td style="padding: 15px; font-weight: bold; font-size: 1.1em; border-top: 2px solid #e5e7eb;">Totalpris:</td>
                  <td style="padding: 15px; font-weight: bold; font-size: 1.1em; text-align: right; border-top: 2px solid #e5e7eb;">${receiptData.total?.toFixed(2)} kr</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; padding-top: 30px; color: #9ca3af; font-size: 0.9em;">
              <p>Voss Taxi - Org.nr: ${receiptData.vatRegistrationNo || '970 148 642 MVA'}</p>
              <p>Dette er en automatisk generert kvittering.</p>
            </div>
          </div>
        `;

        const mailOptions = {
          from: process.env.SMTP_FROM || 'no-reply@vosstaxi.no',
          to: req.email,
          subject: `Kvittering for din tur med Voss Taxi (${req.bookingId})`,
          html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        
        // Update DB
        const updateStmt = db.prepare(`UPDATE receipt_requests SET status = 'sent' WHERE id = ?`);
        updateStmt.run(req.id);
        
        sent++;
        console.log(`✅ Sent receipt to ${req.email} for booking ${req.bookingId}`);

      } catch (err) {
        console.error(`❌ Failed to process receipt for booking ${req.bookingId}:`, err);
      }
    }

    return NextResponse.json({ message: 'Processed', processed, sent });
  } catch (error) {
    console.error('CRON ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
