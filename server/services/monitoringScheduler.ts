import cron from 'node-cron';
import { db } from '../db';
import { monitoringSchedules } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import nodemailer from 'nodemailer';

// Types
interface MonitoringSchedule {
  id: string;
  userId: string;
  url: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  alertThreshold: number;
  emailAlert: boolean;
  isActive: boolean;
  lastRunAt: Date | null;
  lastScore: number | null;
  nextRunAt: Date | null;
}

// Store active cron jobs
const activeJobs = new Map<string, cron.ScheduledTask>();

// SMTP Configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Cron expression mapping
const cronExpressions = {
  hourly: '0 * * * *',    // At minute 0 of every hour
  daily: '0 0 * * *',     // At midnight every day
  weekly: '0 0 * * 0',    // At midnight every Sunday
  monthly: '0 0 1 * *',   // At midnight on the 1st of each month
};

// Calculate next run time
function calculateNextRun(frequency: string): Date {
  const now = new Date();
  const next = new Date(now);

  switch (frequency) {
    case 'hourly':
      next.setHours(now.getHours() + 1, 0, 0, 0);
      break;
    case 'daily':
      next.setDate(now.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      next.setDate(now.getDate() + (7 - now.getDay()));
      next.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(now.getMonth() + 1, 1);
      next.setHours(0, 0, 0, 0);
      break;
    default:
      next.setHours(now.getHours() + 1, 0, 0, 0);
  }

  return next;
}

// Send email alert
async function sendAlert(
  schedule: MonitoringSchedule,
  newScore: number,
  analysisUrl: string
): Promise<void> {
  if (!schedule.emailAlert || !process.env.SMTP_USER) {
    return;
  }

  const previousScore = schedule.lastScore || 0;
  const difference = newScore - previousScore;
  const arrow = difference > 0 ? '↑' : '↓';

  const mailOptions = {
    from: process.env.SMTP_FROM || 'ResponsiAI <noreply@responsiai.com>',
    to: process.env.SMTP_USER, // In production, get user's email from database
    subject: `⚠️ Alert: Website Score Dropped - ${schedule.url}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Responsiveness Score Alert</h2>
        
        <p>Your monitored website <strong>${schedule.url}</strong> has experienced a drop in responsiveness score.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Previous Score:</strong></td>
              <td style="text-align: right;">${previousScore}/100</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Current Score:</strong></td>
              <td style="text-align: right; color: ${newScore < previousScore ? '#dc2626' : '#16a34a'};">
                ${newScore}/100 ${arrow}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Change:</strong></td>
              <td style="text-align: right; color: ${difference < 0 ? '#dc2626' : '#16a34a'};">
                ${difference > 0 ? '+' : ''}${difference} points
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Alert Threshold:</strong></td>
              <td style="text-align: right;">${schedule.alertThreshold}/100</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #dc2626;">
          <strong>⚠️ Score is below your alert threshold of ${schedule.alertThreshold}</strong>
        </p>
        
        <div style="margin: 30px 0;">
          <a href="${analysisUrl}" 
             style="background: #6366f1; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View Full Analysis
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          ResponsiAI Monitoring System<br>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5000'}/monitoring">Manage Schedules</a>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent for schedule ${schedule.id}`);
  } catch (error) {
    console.error(`Failed to send alert email:`, error);
  }
}

// Execute monitoring job
async function executeMonitoringJob(scheduleId: string): Promise<void> {
  try {
    console.log(`Executing monitoring job for schedule ${scheduleId}`);

    // Fetch schedule from database
    const [schedule] = await db
      .select()
      .from(monitoringSchedules)
      .where(eq(monitoringSchedules.id, scheduleId))
      .limit(1);

    if (!schedule || !schedule.isActive) {
      console.log(`Schedule ${scheduleId} not found or not active`);
      return;
    }

    // TODO: Run analysis on schedule.url
    // For now, simulate with random score
    const newScore = Math.floor(Math.random() * 40) + 60; // 60-100

    const shouldAlert =
      schedule.emailAlert &&
      newScore < schedule.alertThreshold &&
      (schedule.lastScore === null || newScore < schedule.lastScore);

    // Update schedule with new run data
    const nextRun = calculateNextRun(schedule.frequency);
    await db
      .update(monitoringSchedules)
      .set({
        lastRunAt: new Date(),
        lastScore: newScore,
        nextRunAt: nextRun,
      })
      .where(eq(monitoringSchedules.id, scheduleId));

    // Send alert if threshold breached
    if (shouldAlert) {
      const analysisUrl = `${process.env.CLIENT_URL || 'http://localhost:5000'}/history`;
      await sendAlert(schedule as MonitoringSchedule, newScore, analysisUrl);
    }

    console.log(
      `Monitoring job completed for ${schedule.url}: score=${newScore}, alert=${shouldAlert}`
    );
  } catch (error) {
    console.error(`Error executing monitoring job ${scheduleId}:`, error);
  }
}

// Monitoring Scheduler Class
class MonitoringScheduler {
  // Start all active schedules on server initialization
  async startAllSchedules(): Promise<void> {
    try {
      const schedules = await db
        .select()
        .from(monitoringSchedules)
        .where(eq(monitoringSchedules.isActive, true));

      console.log(`Starting ${schedules.length} monitoring schedules`);

      for (const schedule of schedules) {
        await this.addSchedule(schedule);
      }
    } catch (error) {
      console.error('Error starting monitoring schedules:', error);
    }
  }

  // Stop all schedules (cleanup on server shutdown)
  stopAllSchedules(): void {
    console.log(`Stopping ${activeJobs.size} monitoring schedules`);
    
    activeJobs.forEach((job, scheduleId) => {
      job.stop();
      console.log(`Stopped schedule ${scheduleId}`);
    });
    
    activeJobs.clear();
  }

  // Add a new schedule
  async addSchedule(schedule: any): Promise<void> {
    // Don't start if already running
    if (activeJobs.has(schedule.id)) {
      console.log(`Schedule ${schedule.id} already running`);
      return;
    }

    // Don't start if not active
    if (!schedule.isActive) {
      console.log(`Schedule ${schedule.id} is not active`);
      return;
    }

    const cronExpression = cronExpressions[schedule.frequency as keyof typeof cronExpressions];
    if (!cronExpression) {
      console.error(`Invalid frequency: ${schedule.frequency}`);
      return;
    }

    // Create cron job
    const task = cron.schedule(cronExpression, () => {
      executeMonitoringJob(schedule.id);
    });

    activeJobs.set(schedule.id, task);
    console.log(`Added schedule ${schedule.id} with frequency ${schedule.frequency}`);

    // Update next run time
    const nextRun = calculateNextRun(schedule.frequency);
    await db
      .update(monitoringSchedules)
      .set({ nextRunAt: nextRun })
      .where(eq(monitoringSchedules.id, schedule.id));
  }

  // Remove a schedule
  removeSchedule(scheduleId: string): void {
    const job = activeJobs.get(scheduleId);
    if (job) {
      job.stop();
      activeJobs.delete(scheduleId);
      console.log(`Removed schedule ${scheduleId}`);
    }
  }

  // Update a schedule
  async updateSchedule(schedule: any): Promise<void> {
    // Remove old job
    this.removeSchedule(schedule.id);
    
    // Add new job with updated config
    if (schedule.isActive) {
      await this.addSchedule(schedule);
    }
  }

  // Get schedule status
  getScheduleStatus(scheduleId: string): boolean {
    return activeJobs.has(scheduleId);
  }

  // Get all active schedule IDs
  getActiveScheduleIds(): string[] {
    return Array.from(activeJobs.keys());
  }

  // Get stats
  getStats() {
    return {
      activeSchedules: activeJobs.size,
      schedulesRunning: Array.from(activeJobs.entries()).map(([id, job]) => ({
        id,
        running: true,
      })),
    };
  }
}

// Export singleton instance
export const monitoringScheduler = new MonitoringScheduler();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping monitoring schedules');
  monitoringScheduler.stopAllSchedules();
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping monitoring schedules');
  monitoringScheduler.stopAllSchedules();
});
