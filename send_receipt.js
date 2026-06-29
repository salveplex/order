const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'send.one.com',
  port: 465,
  secure: true,
  auth: {
    user: 'post@vosstaxi.no',
    pass: 'Ringheim1340&&'
  }
});

// Receipt data from BEO214
const receipt = {
  bookRef: 'BEO214',
  receiptNo: 10190,
  licenseNo: 'R 169',
  total: 1028,
  startDateTime: '2026-06-29T11:08:44',
  endDateTime: '2026-06-29T11:43:20',
  km: 35.21,
  fromAddress: 'VOSS DPS BJØRKELIVEGEN 27, 5705 VOSS',
  toAddress: 'BOLSTADSTRANDI 105, 5723 BOLSTADØYRI',
  vatBasis: 917.86,
  vat: 110.14,
  vatPercentage: 12,
  vatRegistrationNo: 'NO961968836MVA'
};

const formatNOK = (num) => new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(num / 100);

const htmlReceipt = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: bold; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 40px 30px; }
    .status-badge { background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; display: inline-block; margin-bottom: 20px; font-weight: 600; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; font-weight: 600; }
    .section-content { background: #f9fafb; padding: 16px; border-radius: 8px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { color: #1f2937; font-weight: 600; }
    .address-box { background: white; border-left: 4px solid #f59e0b; padding: 12px; margin: 8px 0; }
    .price-section { background: #f3f4f6; padding: 20px; border-radius: 8px; }
    .price-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
    .price-row.total { font-size: 18px; font-weight: bold; color: #1f2937; border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 10px; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    .footer-link { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🚕 VOSS TAXI</h1>
      <p>Kvittering for din tur</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="status-badge">✅ TUR FULLFØRT</div>

      <!-- Booking Info -->
      <div class="section">
        <div class="section-title">Bookinginformasjon</div>
        <div class="section-content">
          <div class="row">
            <span class="label">Bookingnummer</span>
            <span class="value">${receipt.bookRef}</span>
          </div>
          <div class="row">
            <span class="label">Kvitteringsnummer</span>
            <span class="value">#${receipt.receiptNo}</span>
          </div>
          <div class="row">
            <span class="label">Kjøretøy</span>
            <span class="value">${receipt.licenseNo}</span>
          </div>
        </div>
      </div>

      <!-- Date & Time -->
      <div class="section">
        <div class="section-title">Tidsdetaljer</div>
        <div class="section-content">
          <div class="row">
            <span class="label">Avreise</span>
            <span class="value">${new Date(receipt.startDateTime).toLocaleString('no-NO')}</span>
          </div>
          <div class="row">
            <span class="label">Ankomst</span>
            <span class="value">${new Date(receipt.endDateTime).toLocaleString('no-NO')}</span>
          </div>
          <div class="row">
            <span class="label">Kjørte km</span>
            <span class="value">${receipt.km.toFixed(2)} km</span>
          </div>
        </div>
      </div>

      <!-- Route -->
      <div class="section">
        <div class="section-title">Rute</div>
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
          <div style="margin-bottom: 12px;">
            <div class="label" style="margin-bottom: 4px;">🟢 HENTESTED</div>
            <div class="address-box">${receipt.fromAddress}</div>
          </div>
          <div>
            <div class="label" style="margin-bottom: 4px;">🔴 DESTINASJON</div>
            <div class="address-box">${receipt.toAddress}</div>
          </div>
        </div>
      </div>

      <!-- Price -->
      <div class="section">
        <div class="section-title">Prisdetaljer</div>
        <div class="price-section">
          <div class="price-row">
            <span>Grunnbeløp (ex. MVA)</span>
            <span>${formatNOK(receipt.vatBasis)}</span>
          </div>
          <div class="price-row">
            <span>MVA (${receipt.vatPercentage}%)</span>
            <span>${formatNOK(receipt.vat)}</span>
          </div>
          <div class="price-row total">
            <span>TOTALPRIS</span>
            <span>${formatNOK(receipt.total)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Voss Taxi</strong></p>
      <p>Org.nr: ${receipt.vatRegistrationNo}</p>
      <p>Takk for at du reiste med oss! 🚗</p>
      <p style="margin-top: 15px; color: #9ca3af;">Dette er en automatisk generert kvittering.</p>
    </div>
  </div>
</body>
</html>
`;

(async () => {
  try {
    console.log('📧 Sending modern receipt email for BEO214...\n');
    
    const info = await transporter.sendMail({
      from: 'Voss Taxi <post@vosstaxi.no>',
      to: 'salvemeum@protonmail.com',
      subject: `Kvittering for din tur med Voss Taxi (${receipt.bookRef})`,
      html: htmlReceipt
    });
    
    console.log('✅ Receipt email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📨 Email details:');
    console.log('  • Booking: BEO214');
    console.log('  • Distance: 35.21 km');
    console.log('  • Total: 1.028,00 kr');
    console.log('  • Recipient: salvemeum@protonmail.com');
    console.log('\n🎉 Check your inbox to see the modern receipt layout!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
  
  process.exit(0);
})();
