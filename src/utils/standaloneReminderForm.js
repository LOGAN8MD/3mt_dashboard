import {
  buildRentalReminderSettings,
  createReminderRow,
} from './rentalReminderForm';

export const parseCustomReminderTime = (value) => new Date(`${value}+05:30`);

export const customReminderTimeError = (value, startAt, endAt, now = new Date()) => {
  const time = parseCustomReminderTime(value);
  if (Number.isNaN(time.getTime())) return 'Select a valid reminder date and time.';
  if (time < parseCustomReminderTime(startAt)) return 'This reminder is before the plan start time.';
  if (time >= parseCustomReminderTime(endAt)) return 'Select a reminder before the plan end time.';
  if (time <= now) return 'Select a reminder time in the future.';
  return '';
};

export const createSubmissionKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `dashboard-${crypto.randomUUID()}`;
  }
  return `dashboard-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createStandaloneReminderForm = (dateInput) => ({
  customerId: '',
  productId: '',
  startAt: dateInput(),
  endAt: dateInput(24 * 60 * 60 * 1000),
  sharedSubjectEnglish: '',
  sharedSubjectHindi: '',
  sharedBodyEnglish: '',
  sharedBodyHindi: '',
  reminders: [{ ...createReminderRow(), scheduledAt: '' }],
  submissionKey: createSubmissionKey(),
});

export const applySharedContent = (form) => ({
  ...form,
  reminders: form.reminders.map((row) => ({
    ...row,
    subjectEnglish: form.sharedSubjectEnglish,
    subjectHindi: form.sharedSubjectHindi,
    bodyEnglish: form.sharedBodyEnglish,
    bodyHindi: form.sharedBodyHindi,
    templateId: 'custom',
    templateMachineName: '',
    templateAmount: '',
  })),
});

export const buildStandaloneReminderPayload = (form, customer, now = new Date()) => {
  const startsAt = parseCustomReminderTime(form.startAt);
  const endsAt = parseCustomReminderTime(form.endAt);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
    throw new Error('Select a valid plan start and end time. End must be after start.');
  }
  const rows = form.reminders.map((row, index) => {
    if (row.scheduledAt === undefined) return row;
    const error = customReminderTimeError(row.scheduledAt, form.startAt, form.endAt, now);
    if (error) throw new Error(`Reminder ${index + 1}: ${error}`);
    return { ...row, offsetUnit: 'minutes', offsetValue: String((endsAt - parseCustomReminderTime(row.scheduledAt)) / 60000) };
  });
  const reminderSettings = buildRentalReminderSettings(
    { mode: 'custom', reminders: rows },
    {
      customer,
      handoverAt: startsAt,
      expectedReturnAt: endsAt,
      now,
    }
  );

  return {
    customerId: form.customerId,
    ...(form.productId ? { productId: form.productId } : {}),
    startAt: form.startAt,
    endAt: form.endAt,
    reminders: reminderSettings.reminders,
    submissionKey: form.submissionKey,
  };
};
