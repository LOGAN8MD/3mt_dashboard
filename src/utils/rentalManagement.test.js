import {
  buildPaymentPayload,
  buildReturnPayload,
  formatIndiaDateTime,
  isDueSoon,
} from './rentalManagement';

test('due soon includes only active rentals returning in the next 24 hours', () => {
  const now = new Date('2026-11-15T06:30:00.000Z');
  expect(isDueSoon({ status: 'active', expectedReturnAt: '2026-11-16T05:30:00.000Z' }, now)).toBe(true);
  expect(isDueSoon({ status: 'active', expectedReturnAt: '2026-11-16T07:30:00.000Z' }, now)).toBe(false);
  expect(isDueSoon({ status: 'overdue', expectedReturnAt: '2026-11-15T05:30:00.000Z' }, now)).toBe(false);
});

test('payment and return forms convert rupees to integer paise', () => {
  expect(buildPaymentPayload({ amount: '500.25', method: 'upi', reference: 'TXN-1', note: 'Balance' })).toEqual({
    amountPaise: 50025, method: 'upi', reference: 'TXN-1', note: 'Balance',
  });
  const payload = buildReturnPayload({
    actualReturnAt: '2026-11-15T15:00', otherCharges: '100', depositApplied: '750',
    paymentAmount: '250', paymentMethod: 'cash', paymentReference: '', paymentNote: 'At return',
    settlementNote: 'Deposit adjusted', returnNote: 'Machine received',
  });
  expect(payload.actualReturnAt).toMatch(/Z$/);
  expect(payload.otherApprovedChargesPaise).toBe(10000);
  expect(payload.depositAppliedPaise).toBe(75000);
  expect(payload.payment.amountPaise).toBe(25000);
});

test('India date formatter handles absent values', () => {
  expect(formatIndiaDateTime()).toBe('Not recorded');
  expect(formatIndiaDateTime('2026-11-15T09:30:00.000Z')).toMatch(/15 Nov 2026/);
});
