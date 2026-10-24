export const MAX_RENTAL_REMINDERS = 20;
export const DEFAULT_REMINDER_OFFSETS = [720, 60];
export const REMINDER_OFFSET_UNITS = [
  { value: 'minutes', label: 'Minutes', multiplier: 1 },
  { value: 'hours', label: 'Hours', multiplier: 60 },
  { value: 'days', label: 'Days', multiplier: 1440 },
];

const unitMultiplier = (unit) => REMINDER_OFFSET_UNITS.find((item) => item.value === unit)?.multiplier;

export const createReminderRow = (id = `${Date.now()}-${Math.random()}`) => ({
  id,
  offsetValue: '1',
  offsetUnit: 'hours',
  channels: { email: true, whatsapp: true },
  subjectEnglish: '',
  subjectHindi: '',
  bodyEnglish: '',
  bodyHindi: '',
});

const offsetInput = (minutes) => {
  if (minutes % 1440 === 0) return { offsetValue: String(minutes / 1440), offsetUnit: 'days' };
  if (minutes % 60 === 0) return { offsetValue: String(minutes / 60), offsetUnit: 'hours' };
  return { offsetValue: String(minutes), offsetUnit: 'minutes' };
};

export const reminderSettingsToForm = (settings) => {
  if (settings?.mode !== 'custom') return { mode: 'default', reminders: [] };
  return {
    mode: 'custom',
    reminders: (settings.reminders || []).map((row, index) => ({
      ...createReminderRow(`saved-${index}-${row.offsetMinutes}`),
      ...offsetInput(row.offsetMinutes),
      channels: {
        email: row.channels?.includes('email') || false,
        whatsapp: row.channels?.includes('whatsapp') || false,
      },
      subjectEnglish: row.content?.subjectEnglish || '',
      subjectHindi: row.content?.subjectHindi || '',
      bodyEnglish: row.content?.bodyEnglish || '',
      bodyHindi: row.content?.bodyHindi || '',
    })),
  };
};

export const reminderOffsetMinutes = (row) => {
  const value = Number(row.offsetValue);
  const multiplier = unitMultiplier(row.offsetUnit);
  if (!Number.isSafeInteger(value) || value <= 0 || !multiplier) {
    throw new Error('Reminder offset must be a positive whole number');
  }
  const minutes = value * multiplier;
  if (!Number.isSafeInteger(minutes)) throw new Error('Reminder offset is too large');
  return minutes;
};

const requireContact = (customer, channel) => {
  if (channel === 'email' && !String(customer?.email || '').trim()) {
    throw new Error('The selected customer does not have an email address');
  }
  if (channel === 'whatsapp' && !String(customer?.phone || '').trim()) {
    throw new Error('The selected customer does not have a WhatsApp phone number');
  }
};

const reminderPeriod = ({ handoverAt, expectedReturnAt }) => {
  const startsAt = new Date(handoverAt);
  const endsAt = new Date(expectedReturnAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    throw new Error('Select valid rental dates before configuring reminders');
  }
  return { startsAt, endsAt };
};

export const calculateReminderTime = (expectedReturnAt, offsetMinutes) => {
  const endsAt = new Date(expectedReturnAt);
  if (Number.isNaN(endsAt.getTime())) return null;
  return new Date(endsAt.getTime() - offsetMinutes * 60_000);
};

export const formatReminderTimeIST = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Select a valid return time';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const buildRentalReminderSettings = (
  settings,
  { customer, handoverAt, expectedReturnAt, now = new Date() }
) => {
  const { startsAt, endsAt } = reminderPeriod({ handoverAt, expectedReturnAt });
  if (!customer) throw new Error('Select a customer before configuring reminders');
  if (endsAt <= now) throw new Error('Expected return time must be in the future for reminders');

  if (settings?.mode !== 'custom') {
    requireContact(customer, 'email');
    requireContact(customer, 'whatsapp');
    return { mode: 'default', reminders: [] };
  }

  const rows = settings.reminders || [];
  if (rows.length === 0) throw new Error('Add at least one custom reminder');
  if (rows.length > MAX_RENTAL_REMINDERS) {
    throw new Error(`A rental can contain at most ${MAX_RENTAL_REMINDERS} reminders`);
  }

  const offsets = new Set();
  const reminders = rows.map((row, index) => {
    const rowNumber = index + 1;
    let offsetMinutes;
    try { offsetMinutes = reminderOffsetMinutes(row); }
    catch (error) { throw new Error(`Reminder ${rowNumber}: ${error.message}`); }
    if (offsets.has(offsetMinutes)) throw new Error(`Reminder ${rowNumber}: reminder timing must be unique`);
    offsets.add(offsetMinutes);

    const scheduledAt = calculateReminderTime(endsAt, offsetMinutes);
    if (scheduledAt <= now) throw new Error(`Reminder ${rowNumber}: send time must be in the future`);
    if (scheduledAt < startsAt || scheduledAt >= endsAt) {
      throw new Error(`Reminder ${rowNumber}: send time must be within the rental period`);
    }

    const channels = ['email', 'whatsapp'].filter((channel) => row.channels?.[channel]);
    if (channels.length === 0) throw new Error(`Reminder ${rowNumber}: select email or WhatsApp`);
    channels.forEach((channel) => requireContact(customer, channel));

    const bodyEnglish = String(row.bodyEnglish || '').trim();
    const bodyHindi = String(row.bodyHindi || '').trim();
    const subjectEnglish = String(row.subjectEnglish || '').trim();
    const subjectHindi = String(row.subjectHindi || '').trim();
    if (!bodyEnglish) throw new Error(`Reminder ${rowNumber}: English message is required`);
    if (!bodyHindi) throw new Error(`Reminder ${rowNumber}: Hindi message is required`);
    if (subjectEnglish.length > 200 || subjectHindi.length > 200) {
      throw new Error(`Reminder ${rowNumber}: subjects cannot exceed 200 characters`);
    }
    if (bodyEnglish.length > 5000 || bodyHindi.length > 5000) {
      throw new Error(`Reminder ${rowNumber}: messages cannot exceed 5000 characters`);
    }

    return {
      offsetMinutes,
      channels,
      content: { subjectEnglish, subjectHindi, bodyEnglish, bodyHindi },
    };
  });

  return { mode: 'custom', reminders };
};
