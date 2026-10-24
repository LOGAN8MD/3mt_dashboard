import {
  buildStartingMessage,
  buildStandaloneReminderPayload,
} from './standaloneReminderForm';

const customer = { _id: 'customer-1', email: 'deepak@example.com', phone: '9876543210' };
const baseForm = {
  customerId: customer._id,
  productId: 'product-1',
  startAt: '2026-11-15T10:00',
  endAt: '2026-11-16T10:00',
  submissionKey: 'dashboard-request-1',
  reminders: [{
    id: 'row-1', offsetValue: '2', offsetUnit: 'hours',
    channels: { email: true, whatsapp: false },
    subjectEnglish: '', subjectHindi: '', bodyEnglish: 'Please visit the shop.', bodyHindi: 'कृपया दुकान पर आएं।',
  }],
};

test('builds a standalone plan payload without an optional starting message', () => {
  const form = baseForm;
  const payload = buildStandaloneReminderPayload(
    form,
    customer,
    new Date('2026-11-14T10:00:00.000Z')
  );

  expect(payload).toEqual(expect.objectContaining({
    customerId: customer._id,
    productId: 'product-1',
    startAt: baseForm.startAt,
    endAt: baseForm.endAt,
    submissionKey: 'dashboard-request-1',
  }));
  expect(payload.reminders[0]).toEqual(expect.objectContaining({
    offsetMinutes: 120,
    channels: ['email'],
    content: expect.objectContaining({
      bodyEnglish: 'Please visit the shop.',
      bodyHindi: 'कृपया दुकान पर आएं।',
    }),
  }));
});

test('converts multiple exact IST times into API offsets independent of browser timezone', () => {
  const form = { ...baseForm, reminders: [
    { ...baseForm.reminders[0], scheduledAt: '2026-11-15T12:00' },
    { ...baseForm.reminders[0], scheduledAt: '2026-11-16T09:00' },
  ] };
  const payload = buildStandaloneReminderPayload(form, customer, new Date('2026-11-14T00:00Z'));
  expect(payload.reminders.map((row) => row.offsetMinutes)).toEqual([1320, 60]);
});

test.each([
  ['2026-11-15T09:00', /before the plan start/],
  ['2026-11-16T10:00', /before the plan end/],
  ['2026-11-17T10:00', /before the plan end/],
  ['', /valid reminder date/],
])('rejects out-of-period or missing exact time %s', (scheduledAt, error) => {
  const form = { ...baseForm, reminders: [{ ...baseForm.reminders[0], scheduledAt }] };
  expect(() => buildStandaloneReminderPayload(form, customer, new Date('2026-11-14T00:00Z'))).toThrow(error);
});

test('rejects past and duplicate exact times', () => {
  const row = { ...baseForm.reminders[0], scheduledAt: '2026-11-15T12:00' };
  const form = { ...baseForm, reminders: [row, row] };
  expect(() => buildStandaloneReminderPayload(form, customer, new Date('2026-11-15T07:00Z'))).toThrow(/future/);
  expect(() => buildStandaloneReminderPayload(form, customer, new Date('2026-11-14T00:00Z'))).toThrow(/unique/);
});

test('standalone payload keeps product context optional and validates contact channels', () => {
  const form = { ...baseForm, productId: '' };
  expect(buildStandaloneReminderPayload(form, customer, new Date('2026-11-14T10:00:00.000Z')).productId)
    .toBeUndefined();
  expect(() => buildStandaloneReminderPayload(form, { ...customer, email: '' }, new Date('2026-11-14T10:00:00.000Z')))
    .toThrow(/email address/);
});

test('starting content is optional, validated and independent from scheduled messages', () => {
  expect(buildStartingMessage({}, customer)).toBeUndefined();
  expect(() => buildStartingMessage({ sharedSubjectEnglish: 'Hello' }, customer)).toThrow(/both required/);
  const form = { ...baseForm, sharedBodyEnglish: 'Welcome', sharedBodyHindi: 'नमस्ते', startingChannels: { email: true } };
  expect(() => buildStartingMessage({ ...form, startingChannels: {} }, customer)).toThrow(/select Email/);
  expect(() => buildStartingMessage(form, { ...customer, email: '' })).toThrow(/email is missing/);
  const payload = buildStandaloneReminderPayload(form, customer, new Date('2026-11-14T00:00Z'));
  expect(payload.startingMessage.content.bodyEnglish).toBe('Welcome');
  expect(payload.startingMessage.channels).toEqual(['email']);
  expect(payload.reminders[0].content.bodyEnglish).toBe('Please visit the shop.');
});
