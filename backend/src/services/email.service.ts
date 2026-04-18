import nodemailer from 'nodemailer';
import { env } from '../config/env';

function createTransporter() {
  if (!env.email.host || !env.email.user) return null;

  return nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[email] Not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  await transporter.sendMail({ from: env.email.from, to, subject, html });
}

export async function sendPaymentConfirmation(opts: {
  to: string;
  displayName: string;
  planType: string;
  expiresAt: Date;
}): Promise<void> {
  const { to, displayName, planType, expiresAt } = opts;
  const expiry = expiresAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2>Payment Confirmed!</h2>
      <p>Hi ${displayName},</p>
      <p>Your <strong>${planType}</strong> subscription is now active. You have full access to all TOEFL ITP practice tests until <strong>${expiry}</strong>.</p>
      <p><a href="${env.corsOrigin}/tests" style="background:#e4002b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Start Practising</a></p>
      <p style="color:#999;font-size:12px">If you did not make this purchase, please contact support immediately.</p>
    </div>
  `;
  await sendMail(to, 'Your subscription is active!', html);
}

export async function sendResultsReady(opts: {
  to: string;
  displayName: string;
  attemptId: string;
  overallBand: number | null;
}): Promise<void> {
  const { to, displayName, attemptId, overallBand } = opts;
  const bandText = overallBand != null ? `Overall Band: <strong>${overallBand}</strong>` : 'Your results are ready';
  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2>Your Results Are Ready</h2>
      <p>Hi ${displayName},</p>
      <p>${bandText}</p>
      <p>View your detailed feedback including Writing and Speaking scores below.</p>
      <p><a href="${env.corsOrigin}/results/${attemptId}" style="background:#e4002b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">View Results</a></p>
    </div>
  `;
  await sendMail(to, 'Your TOEFL ITP results are ready', html);
}
