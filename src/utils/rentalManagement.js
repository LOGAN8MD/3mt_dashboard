import { rupeesToPaise } from './rentalForm';

export const RENTAL_FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'due_soon', label: 'Due Soon' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const isDueSoon = (rental, now = new Date()) => {
  if (rental.status !== 'active') return false;
  const dueAt = new Date(rental.expectedReturnAt).getTime();
  const current = now.getTime();
  return Number.isFinite(dueAt) && dueAt >= current && dueAt <= current + 24 * 60 * 60 * 1000;
};

export const buildPaymentPayload = (form) => ({
  amountPaise: rupeesToPaise(form.amount, { required: true }),
  method: form.method,
  reference: form.reference.trim(),
  note: form.note.trim(),
});

export const buildReturnPayload = (form) => {
  const actualReturnAt = new Date(form.actualReturnAt);
  if (Number.isNaN(actualReturnAt.getTime())) throw new Error('Select a valid physical return time');
  const paymentAmountPaise = rupeesToPaise(form.paymentAmount);
  return {
    actualReturnAt: actualReturnAt.toISOString(),
    otherApprovedChargesPaise: rupeesToPaise(form.otherCharges),
    depositAppliedPaise: rupeesToPaise(form.depositApplied),
    settlementNote: form.settlementNote.trim(),
    returnNote: form.returnNote.trim(),
    ...(paymentAmountPaise > 0 ? {
      payment: {
        amountPaise: paymentAmountPaise,
        method: form.paymentMethod,
        reference: form.paymentReference.trim(),
        note: form.paymentNote.trim(),
      },
    } : {}),
  };
};

export const formatIndiaDateTime = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const humanize = (value) => String(value || '').replaceAll('_', ' ');
