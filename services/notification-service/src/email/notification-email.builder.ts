import { NotificationType } from '../enums/notification-type.enum';

export interface NotificationEmailParams {
  recipientName: string;
  type: NotificationType | string;
  serialNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  extinguisherStatus?: string;
  appUrl: string;
  summaryLine: string;
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function alertLevelLabel(type: string, daysUntilExpiry: number): string {
  if (type === NotificationType.EXPIRY_0 || daysUntilExpiry <= 0) {
    return 'Expired — immediate renewal required';
  }
  const labels: Record<string, string> = {
    [NotificationType.EXPIRY_7]: '7-day warning',
    [NotificationType.EXPIRY_30]: '30-day reminder',
    [NotificationType.EXPIRY_60]: '60-day reminder',
    [NotificationType.EXPIRY_90]: '90-day reminder',
    [NotificationType.REMINDER_15]: '15-day reminder',
    [NotificationType.REMINDER_30]: '30-day reminder',
    [NotificationType.WARNING]: 'Compliance warning',
  };
  return labels[type] ?? 'Expiry alert';
}

export function buildNotificationEmail(
  params: NotificationEmailParams,
): { subject: string; text: string; html: string } {
  const {
    recipientName,
    type,
    serialNumber,
    expiryDate,
    daysUntilExpiry,
    extinguisherStatus,
    appUrl,
    summaryLine,
  } = params;

  const expiryLabel = formatLongDate(expiryDate);
  const daysLabel =
    daysUntilExpiry <= 0
      ? 'Expired (0 days remaining)'
      : `${daysUntilExpiry} day(s) remaining`;
  const alertLevel = alertLevelLabel(type, daysUntilExpiry);
  const statusLine = extinguisherStatus
    ? `Current status:     ${extinguisherStatus}`
    : null;

  const subject =
    daysUntilExpiry <= 0
      ? `FEMS: Fire extinguisher ${serialNumber} has expired — action required`
      : `FEMS: Fire extinguisher ${serialNumber} expires in ${daysUntilExpiry} day(s)`;

  const detailLines = [
    `Serial number:        ${serialNumber}`,
    `Expiry date:          ${expiryLabel}`,
    `Time remaining:       ${daysLabel}`,
    `Alert level:          ${alertLevel}`,
    ...(statusLine ? [statusLine] : []),
  ].join('\n');

  const text = `Dear ${recipientName},

We are writing to inform you about an important update regarding your registered fire extinguisher in the Fire Extinguisher Management System (FEMS).

Extinguisher details
---------------------
${detailLines}

${summaryLine}

What you should do next
-----------------------
1. Sign in to FEMS: ${appUrl}
2. Open "My Extinguishers" or "Renewals" and schedule renewal before the expiry date.
3. Contact your site administrator if you need assistance or have already renewed this unit.

If you have already completed renewal, please update the extinguisher record in FEMS so future reminders stop.

Kind regards,
Fire Extinguisher Management System (FEMS)

---
This is an automated message. Please do not reply directly to this email.`;

  const htmlDetailRows = [
    ['Serial number', serialNumber],
    ['Expiry date', expiryLabel],
    ['Time remaining', daysLabel],
    ['Alert level', alertLevel],
    ...(extinguisherStatus ? [['Current status', extinguisherStatus]] : []),
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;">${label}</td><td style="padding:6px 0;font-weight:600;">${value}</td></tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#222;max-width:600px;margin:0 auto;padding:24px;">
  <p>Dear <strong>${recipientName}</strong>,</p>
  <p>We are writing to inform you about an important update regarding your registered fire extinguisher in the <strong>Fire Extinguisher Management System (FEMS)</strong>.</p>
  <h3 style="margin:24px 0 8px;font-size:16px;">Extinguisher details</h3>
  <table style="border-collapse:collapse;margin-bottom:16px;">${htmlDetailRows}</table>
  <p style="background:#f5f5f5;padding:12px 16px;border-radius:6px;border-left:4px solid #c62828;">${summaryLine}</p>
  <h3 style="margin:24px 0 8px;font-size:16px;">What you should do next</h3>
  <ol>
    <li>Sign in to <a href="${appUrl}">FEMS</a>.</li>
    <li>Open <strong>My Extinguishers</strong> or <strong>Renewals</strong> and schedule renewal before the expiry date.</li>
    <li>Contact your site administrator if you need help, or update FEMS if renewal is already complete.</li>
  </ol>
  <p>Kind regards,<br><strong>Fire Extinguisher Management System (FEMS)</strong></p>
  <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;">
  <p style="font-size:12px;color:#777;">This is an automated message. Please do not reply directly to this email.</p>
</body>
</html>`;

  return { subject, text, html };
}

export function daysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}
