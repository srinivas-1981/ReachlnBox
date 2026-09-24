import { verifySmtpConnection } from '../modules/email/smtp.client';
import { emailService } from '../modules/email/email.service';

async function run() {
  console.log(' Testing Ethereal SMTP connection...');
  const isReady = await verifySmtpConnection();
  if (!isReady) {
    console.error(' Could not verify SMTP connection');
    process.exit(1);
  }

  console.log(' Sending a test email through Ethereal SMTP...');
  try {
    const result = await emailService.sendEmail({
      to: 'recipient.test@domain.io',
      subject: 'ReachInbox Ethereal SMTP Verification',
      text: 'Hello from ReachInbox!\n\nThis is a verification email dispatched through Ethereal SMTP to confirm that the Nodemailer transporter is working properly.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #059669;">ReachInbox Email Delivery Engine</h2>
          <p>This is a live test message confirming your Ethereal SMTP transporter configuration is operational.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Dispatched at ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log('====================================================');
    console.log(' Email sent successfully!');
    console.log(` Message ID: ${result.messageId}`);
    if (result.previewUrl) {
      console.log(` Ethereal Preview URL: ${result.previewUrl}`);
    }
    console.log('====================================================');
  } catch (error: any) {
    console.error(' Failed to send email:', error?.message || error);
    process.exit(1);
  }
}

run();
