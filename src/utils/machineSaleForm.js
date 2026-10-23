import { rupeesToPaise } from './rentalForm';

export const SALE_STATUSES = ['draft', 'completed', 'cancelled'];

export const buildMachineSalePayload = (form, { status, editing = false } = {}) => {
  if (!form.machineId) throw new Error('Select a machine');
  if (!form.customerId) throw new Error('Select a customer');
  const soldAt = form.soldAt ? new Date(form.soldAt) : null;
  if (form.soldAt && Number.isNaN(soldAt.getTime())) throw new Error('Select a valid sale date and time');

  const initialPaymentPaise = rupeesToPaise(form.initialPaymentAmount);
  const payload = {
    machineId: form.machineId,
    customerId: form.customerId,
    agreedSalePricePaise: rupeesToPaise(form.agreedSalePrice, { required: true }),
    notes: form.notes.trim(),
    ...(soldAt ? { soldAt: soldAt.toISOString() } : {}),
  };
  if (status) payload.status = status;
  if (!editing && initialPaymentPaise > 0) {
    payload.initialPayment = {
      amountPaise: initialPaymentPaise,
      method: form.paymentMethod,
      reference: form.paymentReference.trim(),
      note: form.paymentNote.trim(),
    };
  }
  return payload;
};

export const buildSalePaymentPayload = (form) => ({
  amountPaise: rupeesToPaise(form.amount, { required: true }),
  method: form.method,
  reference: form.reference.trim(),
  note: form.note.trim(),
});
