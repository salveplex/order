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

(async () => {
  try {
    console.log('🧪 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection OK\n');
    
    console.log('📧 Sending test email to salvemeum@protonmail.com...');
    const info = await transporter.sendMail({
      from: 'Booking Voss Taxi <post@vosstaxi.no>',
      to: 'salvemeum@protonmail.com',
      subject: 'Test email from Voss Taxi Order System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f59e0b;">
            <h1 style="margin: 0; color: #1f2937;">Voss Taxi</h1>
            <p style="margin: 5px 0; color: #6b7280;">Test Email</p>
          </div>
          
          <div style="padding: 20px 0;">
            <p>This is a test email from the Voss Taxi Order System.</p>
            <p>If you receive this, SMTP is working correctly!</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Test Date:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${new Date().toLocaleString('no-NO')}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Status:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">✅ SMTP Working</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; padding-top: 30px; color: #9ca3af; font-size: 0.9em;">
            <p>Voss Taxi - Org.nr: 970 148 642 MVA</p>
            <p>This is an automatically generated test email.</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📨 Email should arrive in salvemeum@protonmail.com shortly');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
  }
  
  process.exit(0);
})();
