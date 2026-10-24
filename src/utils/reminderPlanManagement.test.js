import {
  buildPlanUpdatePayload,
  editablePlanOccurrences,
  planContextLabel,
  planEditForm,
} from './reminderPlanManagement';

const customer = { _id: 'customer-1', email: 'deepak@example.com', phone: '9876543210' };
const content = { bodyEnglish: 'English', bodyHindi: 'Hindi' };
const plan = {
  _id: 'plan-1', planType: 'standalone', version: 2, customer,
  product: { _id: 'product-1' }, productContextSnapshot: { name: 'Bosch Drill' },
  startsAt: '2026-11-15T04:30:00.000Z', endsAt: '2026-11-16T04:30:00.000Z',
  occurrences: [
    { scheduleVersion: 1, status: 'sent', scheduledAt: '2026-11-15T20:30:00.000Z', channels: ['email'], contentSnapshot: content },
    { planRowKey: 'OFFSET-60M', scheduleVersion: 2, status: 'pending', scheduledAt: '2026-11-16T03:30:00.000Z', channels: ['whatsapp'], contentSnapshot: content },
  ],
};

test('selects only future unsent occurrences from the current plan version', () => {
  const rows = editablePlanOccurrences(plan, new Date('2026-11-15T10:00:00.000Z'));
  expect(rows).toHaveLength(1);
  expect(rows[0].planRowKey).toBe('OFFSET-60M');
});

test('rebuilds a standalone update payload without historical sent rows', () => {
  const form = planEditForm(plan, new Date('2026-11-15T10:00:00.000Z'));
  const payload = buildPlanUpdatePayload(plan, form, new Date('2026-11-15T10:00:00.000Z'));
  expect(payload).toEqual(expect.objectContaining({
    customerId: customer._id,
    productId: 'product-1',
    reminders: [expect.objectContaining({ offsetMinutes: 60, channels: ['whatsapp'] })],
  }));
  expect(planContextLabel(plan)).toBe('Bosch Drill');
});
