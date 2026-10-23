import {
  buildRentalPayload,
  formatRentalMoney,
  paiseToInput,
  rupeesToPaise,
  toLocalDateTimeInput,
} from './rentalForm';

const form = {
  machineId: 'machine', customerId: 'customer',
  handoverAt: '2026-11-15T10:00', expectedReturnAt: '2026-11-18T10:00',
  billingPeriod: 'day', agreedRate: '500', dailyLateRate: '', securityDeposit: '2000',
  initialPaymentAmount: '1000', paymentMethod: 'upi', paymentReference: 'TXN-1',
  paymentNote: 'Advance', notes: 'Handle carefully',
};

test('rental form converts rupees and dates to the backend contract', () => {
  const payload = buildRentalPayload(form, 'active');
  expect(payload.agreedRatePaise).toBe(50000);
  expect(payload.securityDepositReceivedPaise).toBe(200000);
  expect(payload.initialPayment.amountPaise).toBe(100000);
  expect(payload.status).toBe('active');
  expect(payload.handoverAt).toMatch(/Z$/);
  expect(payload.dailyLateRatePaise).toBeUndefined();
});

test('rental form validates dates and money without floating paise', () => {
  expect(rupeesToPaise('12.34')).toBe(1234);
  expect(paiseToInput(1234)).toBe('12.34');
  expect(formatRentalMoney(50000)).toMatch(/500/);
  expect(toLocalDateTimeInput('2026-11-15T04:30:00.000Z')).toContain('2026-11-15');
  expect(() => buildRentalPayload({ ...form, expectedReturnAt: form.handoverAt }, 'draft')).toThrow(/after/);
  expect(() => rupeesToPaise('-1')).toThrow(/non-negative/);
});
