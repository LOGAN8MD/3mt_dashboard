export const RENTAL_PERIODS = ['day', 'week', 'month'];
export const PAYMENT_METHODS = ['cash', 'upi', 'bank_transfer', 'card', 'other'];

export const rupeesToPaise = (value, { required = false } = {}) => {
  const text = String(value ?? '').trim();
  if (!text) {
    if (required) throw new Error('Amount is required');
    return 0;
  }
  const amount = Number(text);
  const paise = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(paise)) {
    throw new Error('Enter a valid non-negative amount');
  }
  if (required && paise < 1) throw new Error('Amount must be greater than zero');
  return paise;
};

export const paiseToInput = (value) => {
  if (value === undefined || value === null) return '';
  return String(Number(value) / 100);
};

export const formatRentalMoney = (paise) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(Number(paise || 0) / 100);

export const toLocalDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const buildRentalPayload = (form, status) => {
  if (!form.machineId) throw new Error('Select a machine');
  if (!form.customerId) throw new Error('Select a customer');
  const handoverAt = new Date(form.handoverAt);
  const expectedReturnAt = new Date(form.expectedReturnAt);
  if (Number.isNaN(handoverAt.getTime())) throw new Error('Select a valid handover time');
  if (Number.isNaN(expectedReturnAt.getTime())) throw new Error('Select a valid return time');
  if (expectedReturnAt <= handoverAt) throw new Error('Return time must be after handover time');
  if (!RENTAL_PERIODS.includes(form.billingPeriod)) throw new Error('Select a billing period');

  const initialPaymentPaise = rupeesToPaise(form.initialPaymentAmount);
  const payload = {
    machineId: form.machineId,
    customerId: form.customerId,
    handoverAt: handoverAt.toISOString(),
    expectedReturnAt: expectedReturnAt.toISOString(),
    billingPeriod: form.billingPeriod,
    agreedRatePaise: rupeesToPaise(form.agreedRate, { required: true }),
    securityDepositReceivedPaise: rupeesToPaise(form.securityDeposit),
    notes: form.notes.trim(),
    ...(form.dailyLateRate.trim()
      ? { dailyLateRatePaise: rupeesToPaise(form.dailyLateRate, { required: true }) }
      : {}),
    ...(initialPaymentPaise > 0 ? {
      initialPayment: {
        amountPaise: initialPaymentPaise,
        method: form.paymentMethod,
        reference: form.paymentReference.trim(),
        note: form.paymentNote.trim(),
      },
    } : {}),
  };
  if (status) payload.status = status;
  return payload;
};
