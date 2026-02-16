/**
 * Email and SMS notification templates.
 *
 * Each template function returns { subject, html } for email and { body } for SMS.
 * In production, the html would be richer — for now, simple inline-styled HTML.
 */

interface TemplateParams {
  recipientName: string
  otherPartyName: string
  adjustmentType: string // 'SWAP' | 'COVER'
  date: string // formatted display date, e.g. "Mon, Feb 17"
  shiftTime: string // e.g. "6:00 AM – 2:00 PM"
  trackId?: string
  hoursLeft?: number
  minutesLeft?: number
}

// ──────────────────────────────────────────
// EMAIL TEMPLATES
// ──────────────────────────────────────────

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
  <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
    <strong style="font-size: 18px;">SWAPPER</strong>
  </div>
  <h2 style="font-size: 16px; margin: 0 0 16px;">${title}</h2>
  ${body}
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
    This is an automated message from SWAPPER. Please process all official adjustments through Aspect.
  </div>
</body></html>`
}

export function emailListingAccepted(p: TemplateParams) {
  return {
    subject: `Your ${p.adjustmentType.toLowerCase()} listing was accepted`,
    html: emailWrapper(
      `${p.otherPartyName} accepted your ${p.adjustmentType.toLowerCase()} listing`,
      `<p style="margin: 0 0 12px; line-height: 1.5;">
        <strong>${p.otherPartyName}</strong> accepted your ${p.adjustmentType.toLowerCase()} for <strong>${p.date}</strong> (${p.shiftTime}).
      </p>
      <p style="margin: 0 0 12px; line-height: 1.5;">
        You have <strong>24 hours</strong> to enter the Aspect Track ID to confirm this adjustment.
      </p>
      <p style="margin: 0; line-height: 1.5; color: #d97706;">
        If neither party confirms within 24 hours, this adjustment will expire automatically.
      </p>`
    ),
  }
}

export function emailConfirmationReminder(p: TemplateParams) {
  const timeLeft = p.hoursLeft !== undefined
    ? `${p.hoursLeft}h ${p.minutesLeft ?? 0}m`
    : 'less than 4 hours'

  return {
    subject: `Reminder: ${timeLeft} left to confirm ${p.adjustmentType.toLowerCase()}`,
    html: emailWrapper(
      `Confirmation deadline approaching`,
      `<p style="margin: 0 0 12px; line-height: 1.5;">
        Your ${p.adjustmentType.toLowerCase()} with <strong>${p.otherPartyName}</strong> on <strong>${p.date}</strong> (${p.shiftTime}) expires in <strong style="color: #d97706;">${timeLeft}</strong>.
      </p>
      <p style="margin: 0; line-height: 1.5;">
        Please enter the Aspect Track ID in SWAPPER to confirm before it expires.
      </p>`
    ),
  }
}

export function emailAdjustmentConfirmed(p: TemplateParams) {
  return {
    subject: `${p.adjustmentType} confirmed — Track ID: ${p.trackId}`,
    html: emailWrapper(
      `${p.adjustmentType} confirmed!`,
      `<p style="margin: 0 0 12px; line-height: 1.5;">
        Your ${p.adjustmentType.toLowerCase()} with <strong>${p.otherPartyName}</strong> on <strong>${p.date}</strong> (${p.shiftTime}) has been confirmed.
      </p>
      <p style="margin: 0 0 12px; line-height: 1.5;">
        <strong>Aspect Track ID:</strong> ${p.trackId}
      </p>
      <p style="margin: 0; line-height: 1.5; color: #059669;">
        This adjustment is now official. Your calendar has been updated.
      </p>`
    ),
  }
}

export function emailAdjustmentExpired(p: TemplateParams) {
  return {
    subject: `${p.adjustmentType} expired — no Track ID entered`,
    html: emailWrapper(
      `${p.adjustmentType} has expired`,
      `<p style="margin: 0 0 12px; line-height: 1.5;">
        The ${p.adjustmentType.toLowerCase()} with <strong>${p.otherPartyName}</strong> on <strong>${p.date}</strong> (${p.shiftTime}) has expired because no Track ID was entered within 24 hours.
      </p>
      <p style="margin: 0; line-height: 1.5;">
        No changes have been made to your schedule. You can create a new listing if needed.
      </p>`
    ),
  }
}

export function emailShiftReminder(p: TemplateParams) {
  return {
    subject: `Reminder: Modified shift tomorrow (${p.date})`,
    html: emailWrapper(
      `You have a modified shift tomorrow`,
      `<p style="margin: 0 0 12px; line-height: 1.5;">
        Reminder: You have a confirmed ${p.adjustmentType.toLowerCase()} with <strong>${p.otherPartyName}</strong> tomorrow, <strong>${p.date}</strong>.
      </p>
      <p style="margin: 0 0 12px; line-height: 1.5;">
        <strong>Shift:</strong> ${p.shiftTime}
      </p>
      ${p.trackId ? `<p style="margin: 0; line-height: 1.5;"><strong>Track ID:</strong> ${p.trackId}</p>` : ''}`
    ),
  }
}

export function emailObligationCreated(p: TemplateParams & { direction: 'owe' | 'owed' }) {
  const message = p.direction === 'owe'
    ? `You now owe <strong>${p.otherPartyName}</strong> a cover.`
    : `<strong>${p.otherPartyName}</strong> now owes you a cover.`

  return {
    subject: p.direction === 'owe'
      ? `You owe ${p.otherPartyName} a cover`
      : `${p.otherPartyName} owes you a cover`,
    html: emailWrapper(
      'New cover obligation',
      `<p style="margin: 0 0 12px; line-height: 1.5;">
        ${message}
      </p>
      <p style="margin: 0; line-height: 1.5;">
        This is from the confirmed cover on <strong>${p.date}</strong> (${p.shiftTime}).
        View your ledger in SWAPPER to track obligations.
      </p>`
    ),
  }
}

// ──────────────────────────────────────────
// SMS TEMPLATES
// ──────────────────────────────────────────

export function smsListingAccepted(p: TemplateParams) {
  return {
    body: `SWAPPER: ${p.otherPartyName} accepted your ${p.adjustmentType.toLowerCase()} for ${p.date}. Enter Track ID within 24hrs to confirm.`,
  }
}

export function smsConfirmationReminder(p: TemplateParams) {
  const timeLeft = p.hoursLeft !== undefined
    ? `${p.hoursLeft}h ${p.minutesLeft ?? 0}m`
    : '<4hrs'
  return {
    body: `SWAPPER: ${timeLeft} left to confirm ${p.adjustmentType.toLowerCase()} with ${p.otherPartyName} on ${p.date}. Enter Track ID now.`,
  }
}

export function smsAdjustmentConfirmed(p: TemplateParams) {
  return {
    body: `SWAPPER: ${p.adjustmentType} with ${p.otherPartyName} on ${p.date} confirmed. Track ID: ${p.trackId}`,
  }
}

export function smsAdjustmentExpired(p: TemplateParams) {
  return {
    body: `SWAPPER: ${p.adjustmentType} with ${p.otherPartyName} on ${p.date} has expired. No changes to your schedule.`,
  }
}

export function smsShiftReminder(p: TemplateParams) {
  return {
    body: `SWAPPER: Reminder — modified shift tomorrow ${p.date} (${p.shiftTime}) with ${p.otherPartyName}.`,
  }
}
