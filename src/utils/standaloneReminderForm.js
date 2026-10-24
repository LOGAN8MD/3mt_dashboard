import {
  buildRentalReminderSettings,
  createReminderRow,
} from './rentalReminderForm';

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
  reminders: [createReminderRow()],
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
  const reminderSettings = buildRentalReminderSettings(
    { mode: 'custom', reminders: form.reminders },
    {
      customer,
      handoverAt: form.startAt,
      expectedReturnAt: form.endAt,
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
