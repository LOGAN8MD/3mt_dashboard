import {
  buildRentalReminderSettings,
  reminderSettingsToForm,
} from './rentalReminderForm';

const customer = { email: 'deepak@example.com', phone: '9876543210' };
const period = {
  handoverAt: '2026-11-15T10:00:00.000Z',
  expectedReturnAt: '2026-11-18T10:00:00.000Z',
  now: new Date('2026-11-14T10:00:00.000Z'),
};
const row = (overrides = {}) => ({
  id: 'row-1', offsetValue: '12', offsetUnit: 'hours',
  channels: { email: true, whatsapp: true },
  subjectEnglish: 'Machine return', subjectHindi: 'मशीन वापसी',
  bodyEnglish: 'Please return the machine.', bodyHindi: 'कृपया मशीन वापस करें।',
  ...overrides,
});

test('builds default and custom settings for the rental API', () => {
  expect(buildRentalReminderSettings({ mode: 'default', reminders: [] }, { customer, ...period }))
    .toEqual({ mode: 'default', reminders: [] });

  const custom = buildRentalReminderSettings({ mode: 'custom', reminders: [row()] }, { customer, ...period });
  expect(custom.reminders[0]).toEqual(expect.objectContaining({
    offsetMinutes: 720,
    channels: ['email', 'whatsapp'],
    content: expect.objectContaining({ bodyEnglish: 'Please return the machine.' }),
  }));
});

test('rejects duplicate, past, out-of-period, and missing-contact reminders', () => {
  expect(() => buildRentalReminderSettings({ mode: 'custom', reminders: [row(), row({ id: 'row-2' })] }, { customer, ...period }))
    .toThrow(/unique/);
  expect(() => buildRentalReminderSettings({ mode: 'custom', reminders: [row({ offsetValue: '1' })] }, { customer, ...period, now: new Date('2026-11-18T09:30:00.000Z') }))
    .toThrow(/future/);
  expect(() => buildRentalReminderSettings({ mode: 'custom', reminders: [row({ offsetValue: '4', offsetUnit: 'days' })] }, { customer, ...period, now: new Date('2026-11-10T10:00:00.000Z') }))
    .toThrow(/within the rental period/);
  expect(() => buildRentalReminderSettings({ mode: 'custom', reminders: [row()] }, { customer: { email: customer.email }, ...period }))
    .toThrow(/WhatsApp phone number/);
});

test('restores persisted custom reminder settings for draft editing', () => {
  const settings = reminderSettingsToForm({
    mode: 'custom',
    reminders: [{
      offsetMinutes: 1440,
      channels: ['email'],
      content: { bodyEnglish: 'English', bodyHindi: 'Hindi' },
    }],
  });
  expect(settings.mode).toBe('custom');
  expect(settings.reminders[0]).toEqual(expect.objectContaining({
    offsetValue: '1', offsetUnit: 'days',
    channels: { email: true, whatsapp: false },
    bodyEnglish: 'English', bodyHindi: 'Hindi',
  }));
});
