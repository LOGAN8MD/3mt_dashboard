import { buildMachineSalePayload, buildSalePaymentPayload } from './machineSaleForm';

const form = {
  customerId: 'customer-1', machineId: 'machine-1', soldAt: '2026-11-15T10:00',
  agreedSalePrice: '12500.50', initialPaymentAmount: '2500', paymentMethod: 'upi',
  paymentReference: 'TXN-1', paymentNote: 'Advance', notes: 'Customer balance approved',
};

test('machine sale payload converts rupees and India-local form time for direct completion', () => {
  const payload = buildMachineSalePayload(form, { status: 'completed' });
  expect(payload.agreedSalePricePaise).toBe(1250050);
  expect(payload.initialPayment.amountPaise).toBe(250000);
  expect(payload.status).toBe('completed');
  expect(payload.soldAt).toMatch(/Z$/);
});

test('editing preserves existing payments by omitting initial payment replacement', () => {
  const payload = buildMachineSalePayload(form, { editing: true });
  expect(payload.initialPayment).toBeUndefined();
  expect(payload.status).toBeUndefined();
});

test('additional sale payment requires a positive amount in paise', () => {
  expect(buildSalePaymentPayload({ amount: '250.50', method: 'cash', reference: 'R-1', note: 'Part payment' })).toEqual({
    amountPaise: 25050, method: 'cash', reference: 'R-1', note: 'Part payment',
  });
  expect(() => buildSalePaymentPayload({ amount: '', method: 'cash', reference: '', note: '' })).toThrow(/required/);
});
