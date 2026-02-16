import { sendNotification } from './send'
import {
  emailListingAccepted,
  emailConfirmationReminder,
  emailAdjustmentConfirmed,
  emailAdjustmentExpired,
  emailShiftReminder,
  emailObligationCreated,
  smsListingAccepted,
  smsConfirmationReminder,
  smsAdjustmentConfirmed,
  smsAdjustmentExpired,
  smsShiftReminder,
} from './templates'
import { formatTime } from '@/lib/utils/dates'

interface PartyInfo {
  id: string
  name: string
  email: string
  phone: string | null
}

function formatShiftTime(start: string | null, end: string | null): string {
  return `${formatTime(start) ?? '?'} – ${formatTime(end) ?? '?'}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ──────────────────────────────────────────
// LISTING ACCEPTED — notify creator
// ──────────────────────────────────────────

export async function notifyListingAccepted(opts: {
  creator: PartyInfo
  accepter: PartyInfo
  adjustmentType: string
  date: string
  shiftStart: string
  shiftEnd: string
  adjustmentId: string
}) {
  const shiftTime = formatShiftTime(opts.shiftStart, opts.shiftEnd)
  const date = formatDate(opts.date)

  const templateParams = {
    recipientName: opts.creator.name,
    otherPartyName: opts.accepter.name,
    adjustmentType: opts.adjustmentType,
    date,
    shiftTime,
  }

  const email = emailListingAccepted(templateParams)
  const sms = smsListingAccepted(templateParams)

  await sendNotification({
    userId: opts.creator.id,
    eventKey: 'accepted',
    email: { to: opts.creator.email, ...email },
    sms: opts.creator.phone ? { to: opts.creator.phone, ...sms } : undefined,
    relatedAdjustmentId: opts.adjustmentId,
  })
}

// ──────────────────────────────────────────
// CONFIRMATION REMINDER (4hr warning) — notify both parties
// ──────────────────────────────────────────

export async function notifyConfirmationReminder(opts: {
  creator: PartyInfo
  accepter: PartyInfo
  adjustmentType: string
  date: string
  shiftStart: string
  shiftEnd: string
  adjustmentId: string
  hoursLeft: number
  minutesLeft: number
}) {
  const shiftTime = formatShiftTime(opts.shiftStart, opts.shiftEnd)
  const date = formatDate(opts.date)

  for (const recipient of [opts.creator, opts.accepter]) {
    const other = recipient.id === opts.creator.id ? opts.accepter : opts.creator

    const templateParams = {
      recipientName: recipient.name,
      otherPartyName: other.name,
      adjustmentType: opts.adjustmentType,
      date,
      shiftTime,
      hoursLeft: opts.hoursLeft,
      minutesLeft: opts.minutesLeft,
    }

    const email = emailConfirmationReminder(templateParams)
    const sms = smsConfirmationReminder(templateParams)

    await sendNotification({
      userId: recipient.id,
      eventKey: 'timer_warning',
      email: { to: recipient.email, ...email },
      sms: recipient.phone ? { to: recipient.phone, ...sms } : undefined,
      relatedAdjustmentId: opts.adjustmentId,
    })
  }
}

// ──────────────────────────────────────────
// ADJUSTMENT CONFIRMED — notify both parties
// ──────────────────────────────────────────

export async function notifyAdjustmentConfirmed(opts: {
  creator: PartyInfo
  accepter: PartyInfo
  adjustmentType: string
  date: string
  shiftStart: string
  shiftEnd: string
  trackId: string
  adjustmentId: string
}) {
  const shiftTime = formatShiftTime(opts.shiftStart, opts.shiftEnd)
  const date = formatDate(opts.date)

  for (const recipient of [opts.creator, opts.accepter]) {
    const other = recipient.id === opts.creator.id ? opts.accepter : opts.creator

    const templateParams = {
      recipientName: recipient.name,
      otherPartyName: other.name,
      adjustmentType: opts.adjustmentType,
      date,
      shiftTime,
      trackId: opts.trackId,
    }

    const email = emailAdjustmentConfirmed(templateParams)
    const sms = smsAdjustmentConfirmed(templateParams)

    await sendNotification({
      userId: recipient.id,
      eventKey: 'confirmed',
      email: { to: recipient.email, ...email },
      sms: recipient.phone ? { to: recipient.phone, ...sms } : undefined,
      relatedAdjustmentId: opts.adjustmentId,
    })
  }
}

// ──────────────────────────────────────────
// ADJUSTMENT EXPIRED — notify both parties
// ──────────────────────────────────────────

export async function notifyAdjustmentExpired(opts: {
  creator: PartyInfo
  accepter: PartyInfo
  adjustmentType: string
  date: string
  shiftStart: string
  shiftEnd: string
  adjustmentId: string
}) {
  const shiftTime = formatShiftTime(opts.shiftStart, opts.shiftEnd)
  const date = formatDate(opts.date)

  for (const recipient of [opts.creator, opts.accepter]) {
    const other = recipient.id === opts.creator.id ? opts.accepter : opts.creator

    const templateParams = {
      recipientName: recipient.name,
      otherPartyName: other.name,
      adjustmentType: opts.adjustmentType,
      date,
      shiftTime,
    }

    const email = emailAdjustmentExpired(templateParams)
    const sms = smsAdjustmentExpired(templateParams)

    await sendNotification({
      userId: recipient.id,
      eventKey: 'expired',
      email: { to: recipient.email, ...email },
      sms: recipient.phone ? { to: recipient.phone, ...sms } : undefined,
      relatedAdjustmentId: opts.adjustmentId,
    })
  }
}

// ──────────────────────────────────────────
// SHIFT REMINDER (day before) — notify one user
// ──────────────────────────────────────────

export async function notifyShiftReminder(opts: {
  recipient: PartyInfo
  otherParty: PartyInfo
  adjustmentType: string
  date: string
  shiftStart: string
  shiftEnd: string
  trackId?: string
  adjustmentId: string
}) {
  const shiftTime = formatShiftTime(opts.shiftStart, opts.shiftEnd)
  const date = formatDate(opts.date)

  const templateParams = {
    recipientName: opts.recipient.name,
    otherPartyName: opts.otherParty.name,
    adjustmentType: opts.adjustmentType,
    date,
    shiftTime,
    trackId: opts.trackId,
  }

  const email = emailShiftReminder(templateParams)
  const sms = smsShiftReminder(templateParams)

  await sendNotification({
    userId: opts.recipient.id,
    eventKey: 'shift_reminder',
    email: { to: opts.recipient.email, ...email },
    sms: opts.recipient.phone ? { to: opts.recipient.phone, ...sms } : undefined,
    relatedAdjustmentId: opts.adjustmentId,
  })
}

// ──────────────────────────────────────────
// OBLIGATION CREATED (cover ledger) — notify both parties
// ──────────────────────────────────────────

export async function notifyObligationCreated(opts: {
  creditor: PartyInfo
  debtor: PartyInfo
  adjustmentType: string
  date: string
  shiftStart: string
  shiftEnd: string
  adjustmentId: string
}) {
  const shiftTime = formatShiftTime(opts.shiftStart, opts.shiftEnd)
  const date = formatDate(opts.date)

  // Notify debtor: "You owe X a cover"
  const debtorTemplate = emailObligationCreated({
    recipientName: opts.debtor.name,
    otherPartyName: opts.creditor.name,
    adjustmentType: opts.adjustmentType,
    date,
    shiftTime,
    direction: 'owe',
  })

  await sendNotification({
    userId: opts.debtor.id,
    eventKey: 'obligation_created',
    email: { to: opts.debtor.email, ...debtorTemplate },
    relatedAdjustmentId: opts.adjustmentId,
  })

  // Notify creditor: "X owes you a cover"
  const creditorTemplate = emailObligationCreated({
    recipientName: opts.creditor.name,
    otherPartyName: opts.debtor.name,
    adjustmentType: opts.adjustmentType,
    date,
    shiftTime,
    direction: 'owed',
  })

  await sendNotification({
    userId: opts.creditor.id,
    eventKey: 'obligation_created',
    email: { to: opts.creditor.email, ...creditorTemplate },
    relatedAdjustmentId: opts.adjustmentId,
  })
}
