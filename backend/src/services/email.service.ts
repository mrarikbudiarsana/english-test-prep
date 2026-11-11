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

export async function sendMockTestCreditsActivated(opts: {
  to: string;
  displayName: string;
  creditsAdded: number;
  totalCredits: number;
  packageName: string;
}): Promise<void> {
  const { to, displayName, creditsAdded, totalCredits, packageName } = opts;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1e293b;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#08507f;margin:0;font-size:24px;font-weight:800;">English with Arik</h1>
        <p style="color:#64748b;margin:4px 0 0;font-size:14px;">TOEFL ITP Preparation Platform</p>
      </div>

      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="color:#0f172a;margin-top:0;font-size:20px;">Payment Confirmed! 🎉</h2>
        <p style="font-size:15px;line-height:1.6;color:#334155;">Hi <strong>${displayName}</strong>,</p>
        <p style="font-size:15px;line-height:1.6;color:#334155;">
          Thank you for purchasing <strong>${packageName}</strong> on Lynk.id. Your test credits have been activated automatically!
        </p>

        <div style="background:#e8f4fd;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0;">
          <div style="font-size:13px;font-weight:700;color:#08507f;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Credit Balance</div>
          <div style="font-size:22px;font-weight:800;color:#08507f;">
            +${creditsAdded} ${creditsAdded === 1 ? 'Credit' : 'Credits'} Added
          </div>
          <div style="font-size:13px;color:#64748b;margin-top:2px;">
            Total available credits: <strong>${totalCredits}</strong>
          </div>
        </div>

        <p style="font-size:15px;line-height:1.6;color:#334155;">
          You can jump in and start your mock test immediately. Enter your email (<strong>${to}</strong>) when prompted on the test page to use your credit:
        </p>

        <div style="text-align:center;margin:28px 0 20px;">
          <a href="${env.corsOrigin}/tests" style="background:#08507f;color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;box-shadow:0 4px 12px rgba(8,80,127,0.25);">
            Start Your Mock Test →
          </a>
        </div>

        <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:6px;margin:24px 0 8px;">
          <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
            <strong>🛡️ 100% Mock Test Fee Back Guarantee:</strong> If you enroll in any full coaching course with Arik within 7 days, 100% of your mock test fee will be credited toward your tuition!
          </p>
        </div>
      </div>

      <div style="text-align:center;margin-top:24px;font-size:12px;color:#94a3b8;">
        <p style="margin:0 0 4px;">Need assistance? WhatsApp Arik at <a href="https://wa.me/6282144223581" style="color:#08507f;text-decoration:none;font-weight:600;">+62 821-4422-3581</a>.</p>
        <p style="margin:0;">&copy; English with Arik. All rights reserved.</p>
      </div>
    </div>
  `;
  await sendMail(to, 'Your TOEFL ITP Mock Test Credits are Active! 🎯', html);
}
