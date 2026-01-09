import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * Email service for sending notifications
 */
class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check if email is configured
    const emailHost = process.env.SMTP_HOST;
    const emailPort = process.env.SMTP_PORT;
    const emailUser = process.env.SMTP_USER;
    const emailPass = process.env.SMTP_PASS;
    const fromEmail = process.env.EMAIL_FROM;

    if (!emailHost || !emailUser || !emailPass || !fromEmail) {
      console.log('ℹ️  Email service not configured, notifications will be logged only');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: emailHost,
        port: parseInt(emailPort || '587'),
        secure: emailPort === '465', // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      this.isConfigured = true;
      console.log('✅ Email service configured');
    } catch (error) {
      console.error('⚠️  Failed to configure email service:', error);
    }
  }

  /**
   * Send a subscription confirmation email
   */
  async sendSubscriptionConfirmation(to: string, planName: string) {
    const subject = `Welcome to ${planName}!`;
    const html = `
      <h1>Subscription Confirmed</h1>
      <p>Thank you for subscribing to the <strong>${planName}</strong> plan!</p>
      <p>You now have access to all the features included in your plan.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The ResponsiAI Team</p>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  /**
   * Send a subscription cancellation email
   */
  async sendSubscriptionCancellation(to: string, planName: string, endDate: Date) {
    const subject = 'Subscription Cancellation Confirmed';
    const formattedDate = endDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const html = `
      <h1>Subscription Cancelled</h1>
      <p>Your <strong>${planName}</strong> subscription has been cancelled.</p>
      <p>You'll continue to have access to your plan features until <strong>${formattedDate}</strong>.</p>
      <p>We're sorry to see you go! If you have feedback on how we can improve, please let us know.</p>
      <p>Best regards,<br>The ResponsiAI Team</p>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  /**
   * Send a payment failure notification
   */
  async sendPaymentFailure(to: string, planName: string) {
    const subject = 'Payment Failed - Action Required';
    const html = `
      <h1>Payment Failed</h1>
      <p>We were unable to process the payment for your <strong>${planName}</strong> subscription.</p>
      <p>Please update your payment method to avoid service interruption.</p>
      <p><a href="${process.env.APP_URL}/settings">Update Payment Method</a></p>
      <p>Best regards,<br>The ResponsiAI Team</p>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  /**
   * Send a usage limit warning
   */
  async sendUsageLimitWarning(to: string, used: number, limit: number, planName: string) {
    const subject = 'Usage Limit Warning';
    const percentage = Math.round((used / limit) * 100);
    
    const html = `
      <h1>Usage Limit Warning</h1>
      <p>You've used <strong>${used} of ${limit}</strong> (${percentage}%) analyses this month on your <strong>${planName}</strong> plan.</p>
      <p>Consider upgrading your plan if you need more analyses.</p>
      <p><a href="${process.env.APP_URL}/billing">View Plans</a></p>
      <p>Best regards,<br>The ResponsiAI Team</p>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  /**
   * Generic email sender
   */
  private async sendEmail(to: string, subject: string, html: string) {
    if (!this.isConfigured || !this.transporter) {
      console.log(`📧 [EMAIL] To: ${to}, Subject: ${subject}`);
      console.log(`📧 [EMAIL] Would send: ${html.replace(/<[^>]*>/g, '').substring(0, 100)}...`);
      return { success: true, mode: 'logged' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });

      console.log(`✅ Email sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return { success: false, error };
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
