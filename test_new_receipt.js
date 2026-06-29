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

// Actual receipt data from BEO214
const receipt = {
  bookRef: 'BEO214',
  receiptNo: 10190,
  licenseNo: 'R 169',
  driverId: 1691,
  total: 102800, // cents - 1028,00 kr
  startDateTime: '2026-06-29T11:08:44',
  endDateTime: '2026-06-29T11:43:20',
  km: 35.21,
  fromAddress: 'VOSS DPS BJØRKELIVEGEN 27, 5705 VOSS',
  toAddress: 'BOLSTADSTRANDI 105, 5723 BOLSTADØYRI',
  vatBasis: 91786, // cents
  vat: 11014, // cents
  vatPercentage: 12,
  vatRegistrationNo: 'NO961968836MVA',
  // Additional fields from Taxi4U system
  driverId: 1011,
  taxiAccountNo: '1011',
  clientName: 'Privat',
  rekvisjonsnr: '266080062191',
  pristilbud: 0
};

const formatNOK = (amount) => {
  return (amount / 100).toLocaleString('no-NO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const startTime = new Date(receipt.startDateTime).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
const endTime = new Date(receipt.endDateTime).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
const receiptDate = new Date(receipt.startDateTime).toLocaleDateString('no-NO', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });
const receiptDateShort = new Date(receipt.startDateTime).toLocaleDateString('no-NO', { year: 'numeric', month: '2-digit', day: '2-digit' });

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background: #f0f0f0; padding: 20px; }
    .receipt { max-width: 680px; margin: 0 auto; background: white; }
    .header { background: #1a2332; border-radius: 16px 16px 0 0; padding: 24px 30px; display: flex; justify-content: space-between; align-items: flex-start; color: white; }
    .header-left h1 { font-size: 36px; font-weight: bold; margin-bottom: 8px; }
    .header-left h1 .yellow { color: #fbbf24; }
    .header-left p { font-size: 12px; opacity: 0.8; }
    .header-right { text-align: right; }
    .badge { background: #fbbf24; color: #1a2332; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 12px; display: inline-block; margin-bottom: 8px; }
    .receipt-no { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
    .receipt-date { font-size: 12px; opacity: 0.8; }
    .amount-box { background: #f5f5f5; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e5e5; }
    .amount-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .amount-value { font-size: 32px; font-weight: bold; color: #1a2332; }
    .time-range { font-size: 14px; color: #1a2332; }
    .columns { display: flex; padding: 20px 30px; gap: 30px; border-bottom: 1px solid #e5e5e5; }
    .column { flex: 1; }
    .column-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #1a2332; margin-bottom: 12px; display: flex; align-items: center; gap: 4px; }
    .column-title::before { content: '●'; color: #fbbf24; }
    .column-row { display: flex; margin-bottom: 8px; font-size: 13px; }
    .column-label { color: #666; width: 50px; }
    .column-value { color: #1a2332; flex: 1; }
    .table-section { padding: 20px 30px; border-bottom: 1px solid #e5e5e5; }
    .table-title { font-size: 14px; font-weight: bold; color: #1a2332; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 0; border-bottom: 1px solid #ddd; font-weight: 600; color: #666; text-transform: uppercase; font-size: 11px; }
    td { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    tr:hover { background: #f9f9f9; }
    tr.total td { background: #fef3c7; font-weight: bold; border-top: 2px solid #fbbf24; padding-top: 12px; }
    .footer-section { padding: 20px 30px; display: flex; justify-content: space-between; border-bottom: 1px solid #e5e5e5; font-size: 13px; }
    .footer-item { text-align: center; flex: 1; }
    .footer-label { color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
    .footer-value { font-weight: bold; font-size: 16px; color: #1a2332; }
    .final-total { padding: 20px 30px; text-align: right; font-size: 14px; }
    .final-label { color: #666; }
    .final-value { font-size: 24px; font-weight: bold; color: #1a2332; }
    .bottom-note { background: #f5f5f5; padding: 16px 30px; text-align: center; font-size: 11px; color: #999; border-radius: 0 0 16px 16px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="header-left">
        <h1><span class="yellow">Voss</span><br><span class="yellow">Taxi</span></h1>
        <p>Tlf. 56 51 13 40 | Org.nr: ${receipt.vatRegistrationNo}</p>
      </div>
      <div class="header-right">
        <div class="badge">KVITTERING</div>
        <div class="receipt-no">#${receipt.receiptNo}</div>
        <div class="receipt-date">${receiptDate}</div>
      </div>
    </div>

    <div class="amount-box">
      <div>
        <div class="amount-label">Betalt</div>
        <div class="amount-value">${formatNOK(receipt.total)} kr</div>
      </div>
      <div class="time-range">${startTime} - ${endTime}</div>
    </div>

    <div style="padding: 20px 30px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Torsdag</div>
          <div style="font-weight: bold; color: #1a2332;">${receiptDateShort}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Kvitt.nr</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.receiptNo}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Fører ID</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.driverId}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Løyve nr</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.licenseNo}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Rekv.nr</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.rekvisjonsnr}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Klient</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.clientName}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Pristilbud</div>
          <div style="font-weight: bold; color: #1a2332;">${formatNOK(receipt.pristilbud * 100)}</div>
        </div>
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Org.nr</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.vatRegistrationNo}</div>
        </div>
      </div>

      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <div style="margin-bottom: 12px;">
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Frå</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.fromAddress}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Til</div>
          <div style="font-weight: bold; color: #1a2332;">${receipt.toAddress}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Frå sone</div>
            <div style="font-weight: bold; color: #1a2332;">100</div>
          </div>
          <div>
            <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Til</div>
            <div style="font-weight: bold; color: #1a2332;">705</div>
          </div>
        </div>
      </div>
    </div>

    <div style="padding: 20px 30px; border-bottom: 1px solid #e5e5e5; font-size: 13px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div>
          <div style="color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Kreditt</div>
          <div style="font-weight: bold; color: #1a2332;">KTO: ${receipt.taxiAccountNo}</div>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="table-title">Spesifikasjon</div>
      <table>
        <thead>
          <tr>
            <th>Takst</th>
            <th>Type</th>
            <th>Grunnlag</th>
            <th>KM</th>
            <th>Tid</th>
            <th style="text-align: right;">KR</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Start</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td style="text-align: right;">0,00</td>
          </tr>
          <tr>
            <td>Kjørt</td>
            <td></td>
            <td>${receipt.km} km</td>
            <td>${receipt.km}</td>
            <td></td>
            <td style="text-align: right;">${formatNOK(receipt.vatBasis)}</td>
          </tr>
          <tr class="total">
            <td colspan="5">Totalt</td>
            <td style="text-align: right;">${formatNOK(receipt.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-section">
      <div class="footer-item">
        <div class="footer-label">MVA ${receipt.vatPercentage}%</div>
        <div class="footer-value">${formatNOK(receipt.vat)} kr</div>
      </div>
      <div class="footer-item">
        <div class="footer-label">Grunnlag</div>
        <div class="footer-value">${formatNOK(receipt.vatBasis)} kr</div>
      </div>
    </div>

    <div class="final-total">
      <div class="final-label">Total:</div>
      <div class="final-value">${formatNOK(receipt.total)} kr</div>
    </div>

    <div class="bottom-note">
      Modernisert design/utskrift - data hentet frå taksiapparat
    </div>
  </div>
</body>
</html>`;

(async () => {
  try {
    console.log('📧 Sending NEW PDF-matching receipt for BEO214...\n');

    const info = await transporter.sendMail({
      from: 'Voss Taxi <post@vosstaxi.no>',
      to: 'salvemeum@protonmail.com',
      subject: `Kvittering for din tur med Voss Taxi (${receipt.bookRef})`,
      html: htmlContent
    });

    console.log('✅ Receipt sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📊 Receipt Details:');
    console.log(`  • Booking: ${receipt.bookRef}`);
    console.log(`  • Amount: ${formatNOK(receipt.total)} kr`);
    console.log(`  • VAT (12%): ${formatNOK(receipt.vat)} kr`);
    console.log(`  • Base: ${formatNOK(receipt.vatBasis)} kr`);
    console.log(`  • Distance: ${receipt.km} km`);
    console.log(`  • Time: ${startTime} - ${endTime}`);
    console.log('\n🎉 Check your inbox - this now matches the PDF design!');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  process.exit(0);
})();
