import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { formatRentalMoney, PAYMENT_METHODS, toLocalDateTimeInput } from '../utils/rentalForm';
import {
  buildPaymentPayload,
  buildReturnPayload,
  formatIndiaDateTime,
  humanize,
  isDueSoon,
  RENTAL_FILTERS,
} from '../utils/rentalManagement';

const fieldClass = 'w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-xs font-semibold uppercase text-gray-400';
const buttonClass = 'rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50';
const nowInput = () => toLocalDateTimeInput(new Date());
const initialPayment = () => ({ amount: '', method: 'cash', reference: '', note: '' });
const initialReturn = (rental) => ({
  actualReturnAt: nowInput(), otherCharges: '', depositApplied: '',
  paymentAmount: '', paymentMethod: 'cash', paymentReference: '', paymentNote: '',
  settlementNote: '', returnNote: '',
});

const statusColors = {
  active: 'border-green-500/50 bg-green-950/40 text-green-300',
  overdue: 'border-red-500/50 bg-red-950/40 text-red-300',
  returned: 'border-blue-500/50 bg-blue-950/40 text-blue-300',
  cancelled: 'border-gray-500/50 bg-gray-800 text-gray-300',
};

const StatusBadge = ({ status }) => <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold uppercase ${statusColors[status] || statusColors.cancelled}`}>{humanize(status)}</span>;

const MoneyLine = ({ label, value, tone = '' }) => <div><dt className="text-xs uppercase text-gray-500">{label}</dt><dd className={`mt-1 font-semibold ${tone}`}>{formatRentalMoney(value)}</dd></div>;

const RentalManagementPanel = () => {
  const [rentals, setRentals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [action, setAction] = useState('');
  const [busy, setBusy] = useState(false);
  const [extension, setExtension] = useState({ expectedReturnAt: '', note: '' });
  const [payment, setPayment] = useState(initialPayment);
  const [returnForm, setReturnForm] = useState(initialReturn);
  const [returnPreview, setReturnPreview] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadRentals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: filter === 'due_soon' ? 100 : 20 };
      if (filter === 'due_soon') params.status = 'active';
      else params.status = filter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/api/rentals', { params });
      const nextRentals = filter === 'due_soon' ? data.rentals.filter((rental) => isDueSoon(rental)) : data.rentals;
      setRentals(nextRentals);
      setPagination(filter === 'due_soon'
        ? { page: 1, pages: 1, total: nextRentals.length }
        : data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load rentals');
    } finally { setLoading(false); }
  }, [filter, page, search]);

  useEffect(() => {
    const timer = setTimeout(loadRentals, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadRentals, search]);

  const loadDetail = useCallback(async (rentalId) => {
    setDetailLoading(true);
    try {
      const [rentalResponse, reminderResponse] = await Promise.all([
        api.get(`/api/rentals/${rentalId}`),
        api.get('/api/reminders/occurrences', { params: { rental: rentalId, limit: 100 } }),
      ]);
      setSelected(rentalResponse.data);
      setReminders(reminderResponse.data.occurrences || []);
      return rentalResponse.data;
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not load rental details');
      return null;
    } finally { setDetailLoading(false); }
  }, []);

  const openRental = async (rental) => {
    setSelected(rental);
    setAction('');
    setReturnPreview(null);
    await loadDetail(rental._id);
  };

  const closeDetail = () => {
    setSelected(null);
    setReminders([]);
    setAction('');
    setReturnPreview(null);
  };

  const refreshAfterAction = async (message) => {
    toast.success(message);
    setAction('');
    setReturnPreview(null);
    if (selected?._id) await loadDetail(selected._id);
    await loadRentals();
  };

  const beginAction = (nextAction) => {
    setAction(nextAction);
    setReturnPreview(null);
    if (nextAction === 'extend') setExtension({ expectedReturnAt: toLocalDateTimeInput(selected.expectedReturnAt), note: '' });
    if (nextAction === 'payment') setPayment(initialPayment());
    if (nextAction === 'return') setReturnForm(initialReturn(selected));
    if (nextAction === 'cancel') setCancelReason('');
  };

  const submitExtension = async () => {
    const expectedReturnAt = new Date(extension.expectedReturnAt);
    if (Number.isNaN(expectedReturnAt.getTime())) return toast.error('Select a valid new return time');
    if (!extension.note.trim()) return toast.error('Extension note is required');
    setBusy(true);
    try {
      await api.post(`/api/rentals/${selected._id}/extend`, { expectedReturnAt: expectedReturnAt.toISOString(), note: extension.note.trim() });
      await refreshAfterAction('Rental extended and reminders rescheduled');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not extend rental'); }
    finally { setBusy(false); }
  };

  const submitPayment = async () => {
    let payload;
    try { payload = buildPaymentPayload(payment); }
    catch (validationError) { return toast.error(validationError.message); }
    setBusy(true);
    try {
      await api.post(`/api/rentals/${selected._id}/payments`, payload);
      await refreshAfterAction('Payment recorded');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not record payment'); }
    finally { setBusy(false); }
  };

  const prepareReturnPayload = () => {
    try { return buildReturnPayload(returnForm); }
    catch (validationError) { toast.error(validationError.message); return null; }
  };

  const previewReturn = async () => {
    const payload = prepareReturnPayload();
    if (!payload) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/api/rentals/${selected._id}/return-preview`, payload);
      setReturnPreview(data);
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not preview return'); }
    finally { setBusy(false); }
  };

  const confirmReturn = async () => {
    const payload = prepareReturnPayload();
    if (!payload) return;
    if (!returnPreview) return toast.error('Preview the settlement before confirming the return');
    if (!window.confirm('Confirm the physical return and release this machine as available?')) return;
    setBusy(true);
    try {
      await api.post(`/api/rentals/${selected._id}/return`, payload);
      await refreshAfterAction('Return recorded and machine made available');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not record return'); }
    finally { setBusy(false); }
  };

  const submitCancellation = async () => {
    if (!cancelReason.trim()) return toast.error('Cancellation reason is required');
    if (!window.confirm('Cancel this rental? Active or overdue machines will be released.')) return;
    setBusy(true);
    try {
      await api.post(`/api/rentals/${selected._id}/cancel`, { reason: cancelReason.trim() });
      await refreshAfterAction('Rental cancelled');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not cancel rental'); }
    finally { setBusy(false); }
  };

  const canService = selected && ['active', 'overdue'].includes(selected.status);
  const canPay = Boolean(selected && (
    ['active', 'overdue'].includes(selected.status)
    || (selected.status === 'returned' && selected.remainingBalancePaise > 0)
  ));
  const paidAmount = selected?.rentalPaymentsReceivedPaise || 0;
  const displayedFinalCharge = selected?.status === 'returned'
    ? selected.finalRentalChargePaise
    : selected?.overdueEstimate?.estimatedFinalRentalChargePaise || selected?.plannedRentalChargePaise || 0;
  const displayedLateCharge = selected?.status === 'returned'
    ? selected.lateChargePaise
    : selected?.overdueEstimate?.lateChargePaise || 0;
  const currentBalance = selected?.status === 'returned'
    ? selected.remainingBalancePaise
    : Math.max(0, displayedFinalCharge - paidAmount);
  const sortedAudit = useMemo(() => [...(selected?.auditHistory || [])].reverse(), [selected]);

  return <section aria-labelledby="rental-management-heading">
    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div><h2 id="rental-management-heading" className="text-lg font-semibold text-white">Rental management</h2><p className="mt-1 text-sm text-gray-400">Due Soon includes active rentals due within the next 24 hours.</p></div>
      <label className="w-full xl:max-w-sm"><span className={labelClass}>Search</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rental, customer, phone, machine" className={fieldClass} /></label>
    </div>
    <div className="mb-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Rental status">
      {RENTAL_FILTERS.map((item) => <button key={item.value} role="tab" aria-selected={filter === item.value} onClick={() => { setFilter(item.value); setPage(1); }} className={`shrink-0 rounded px-3 py-2 text-sm font-semibold ${filter === item.value ? 'bg-blue-600 text-white' : 'border border-gray-600 text-gray-300'}`}>{item.label}</button>)}
    </div>
    {error && <div role="alert" className="mb-5 border-l-4 border-red-500 bg-red-950/30 p-4 text-red-200">{error} <button onClick={loadRentals} className="ml-3 underline">Retry</button></div>}
    {loading ? <p role="status" className="py-8 text-gray-400">Loading rentals...</p> : rentals.length === 0 ? <p className="border-y border-gray-700 py-10 text-center text-gray-400">No {filter === 'due_soon' ? 'due soon' : filter} rentals found.</p> : <div className="divide-y divide-gray-700 border-y border-gray-700">
      {rentals.map((rental) => <button key={rental._id} onClick={() => openRental(rental)} className="grid w-full grid-cols-1 gap-3 px-1 py-5 text-left hover:bg-gray-800/50 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto] xl:items-center">
        <div><p className="font-semibold text-white">{rental.machineSnapshot.name}</p><p className="text-xs text-gray-400">{rental.rentalCode}</p></div>
        <div><p className="text-sm text-white">{rental.customerSnapshot.name}</p><p className="text-xs text-gray-400">{rental.customerSnapshot.phone || rental.customerSnapshot.email || 'No contact'}</p></div>
        <div><p className="text-xs uppercase text-gray-500">Expected return</p><p className="text-sm">{formatIndiaDateTime(rental.expectedReturnAt)}</p></div>
        <div><p className="text-xs uppercase text-gray-500">Planned charge</p><p className="text-sm font-semibold">{formatRentalMoney(rental.plannedRentalChargePaise)}</p></div>
        <StatusBadge status={rental.status} />
      </button>)}
    </div>}
    {pagination.pages > 1 && <div className="mt-5 flex items-center justify-between"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={`${buttonClass} border-gray-600`}>Previous</button><span className="text-sm text-gray-400">Page {pagination.page} of {pagination.pages} · {pagination.total} rentals</span><button disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className={`${buttonClass} border-gray-600`}>Next</button></div>}

    {selected && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Rental details">
      <div className="my-4 w-full max-w-5xl rounded border border-gray-700 bg-gray-950 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-700 bg-gray-950 p-5"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-white">{selected.machineSnapshot.name}</h2><StatusBadge status={selected.status} /></div><p className="mt-1 text-sm text-gray-400">{selected.rentalCode}</p></div><button onClick={closeDetail} className="rounded border border-gray-600 px-3 py-2" aria-label="Close rental details">Close</button></header>
        {detailLoading ? <p role="status" className="p-8 text-gray-400">Loading complete rental details...</p> : <div className="space-y-8 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section><h3 className="mb-3 font-semibold text-white">Customer</h3><p>{selected.customerSnapshot.name}</p><p className="text-sm text-gray-400">{selected.customerSnapshot.phone || 'No phone'}</p><p className="text-sm text-gray-400">{selected.customerSnapshot.email || 'No email'}</p><p className="text-sm text-gray-400">{selected.customerSnapshot.address || 'No address'}</p></section>
            <section><h3 className="mb-3 font-semibold text-white">Machine</h3><p>{selected.machineSnapshot.name}</p><p className="text-sm text-gray-400">{[selected.machineSnapshot.brand, selected.machineSnapshot.model, selected.machineSnapshot.category].filter(Boolean).join(' · ') || 'No additional machine details'}</p><p className="text-sm text-gray-400">Billing: {formatRentalMoney(selected.agreedRatePaise)} per {selected.billingPeriod}</p></section>
          </div>
          <section><h3 className="mb-3 font-semibold text-white">Rental dates</h3><dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><div><dt className={labelClass}>Handover</dt><dd>{formatIndiaDateTime(selected.handoverAt)}</dd></div><div><dt className={labelClass}>Expected return</dt><dd>{formatIndiaDateTime(selected.expectedReturnAt)}</dd></div><div><dt className={labelClass}>Actual return</dt><dd>{formatIndiaDateTime(selected.actualReturnAt)}</dd></div><div><dt className={labelClass}>Return recorded</dt><dd>{formatIndiaDateTime(selected.returnRecordedAt)}</dd></div></dl></section>
          <section><h3 className="mb-3 font-semibold text-white">Financial summary</h3><dl className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-6"><MoneyLine label="Planned rent" value={selected.plannedRentalChargePaise} /><MoneyLine label={selected.status === 'overdue' ? 'Estimated total rent' : 'Final rent'} value={displayedFinalCharge} /><MoneyLine label={selected.status === 'overdue' ? `Estimated late · ${selected.overdueEstimate?.lateDays || 0} day(s)` : 'Late charge'} value={displayedLateCharge} tone={displayedLateCharge ? 'text-red-300' : ''} /><MoneyLine label="Rent paid" value={paidAmount} tone="text-green-300" /><MoneyLine label="Deposit" value={selected.securityDepositReceivedPaise} /><MoneyLine label={selected.status === 'overdue' ? 'Estimated balance' : 'Balance'} value={currentBalance} tone={currentBalance ? 'text-yellow-300' : 'text-green-300'} /></dl>
            {selected.status === 'returned' && <dl className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4"><MoneyLine label="Other charges" value={selected.otherApprovedChargesPaise} /><MoneyLine label="Deposit applied" value={selected.depositAppliedPaise} /><MoneyLine label="Deposit refund" value={selected.depositRefundPaise} /><MoneyLine label="Rent refund" value={selected.rentalPaymentRefundPaise} /></dl>}
          </section>
          <section><h3 className="mb-3 font-semibold text-white">Notes</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div><p className={labelClass}>Rental</p><p className="text-sm">{selected.notes || 'None'}</p></div><div><p className={labelClass}>Return condition</p><p className="text-sm">{selected.returnConditionNote || 'None'}</p></div><div><p className={labelClass}>Settlement</p><p className="text-sm">{selected.settlementNote || 'None'}</p></div></div>{selected.cancellationReason && <p className="mt-4 text-sm text-red-300">Cancellation: {selected.cancellationReason}</p>}</section>

          <section><h3 className="mb-3 font-semibold text-white">Payments</h3>{selected.payments?.length ? <div className="divide-y divide-gray-700">{selected.payments.map((item, index) => <div key={item._id || index} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-4"><strong>{formatRentalMoney(item.amountPaise)}</strong><span className="text-sm capitalize">{humanize(item.method)}</span><span className="text-sm text-gray-400">{formatIndiaDateTime(item.paidAt)}</span><span className="text-sm text-gray-400">{item.reference || item.note || 'No reference'}</span></div>)}</div> : <p className="text-sm text-gray-400">No rental payments recorded.</p>}</section>
          <section><h3 className="mb-3 font-semibold text-white">Reminder history</h3>{reminders.length ? <div className="divide-y divide-gray-700">{reminders.map((item) => <div key={item._id} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[1fr_auto_auto]"><div><p className="text-sm font-medium capitalize">{humanize(item.definitionType)}</p><p className="text-xs text-gray-400">{formatIndiaDateTime(item.scheduledAt)}</p></div><span className="text-xs capitalize text-gray-300">Email: {humanize(item.emailDelivery?.status)}</span><span className="text-xs capitalize text-gray-300">WhatsApp: {humanize(item.whatsappDelivery?.status)}</span></div>)}</div> : <p className="text-sm text-gray-400">No reminder occurrences found.</p>}</section>
          <section><h3 className="mb-3 font-semibold text-white">Audit history</h3>{sortedAudit.length ? <div className="divide-y divide-gray-700">{sortedAudit.map((item) => <div key={item._id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm capitalize">{humanize(item.action)}</strong><span className="text-xs text-gray-500">{formatIndiaDateTime(item.performedAt)}</span></div><p className="mt-1 text-sm text-gray-400">{item.note || 'No note'}</p></div>)}</div> : <p className="text-sm text-gray-400">No audit entries found.</p>}</section>

          {(canService || canPay || ['draft', 'active', 'overdue'].includes(selected.status)) && <section className="border-t border-gray-700 pt-6"><h3 className="mb-4 font-semibold text-white">Actions</h3><div className="flex flex-wrap gap-2">{canService && <><button onClick={() => beginAction('extend')} className={`${buttonClass} border-blue-500/60 text-blue-300`}>Extend rental</button><button onClick={() => beginAction('return')} className={`${buttonClass} border-green-500/60 text-green-300`}>Record return</button></>}{canPay && <button onClick={() => beginAction('payment')} className={`${buttonClass} border-yellow-500/60 text-yellow-300`}>Add payment</button>}{['draft', 'active', 'overdue'].includes(selected.status) && <button onClick={() => beginAction('cancel')} className={`${buttonClass} border-red-500/60 text-red-300`}>Cancel rental</button>}</div>
            {action === 'extend' && <div className="mt-5 grid grid-cols-1 gap-4 border-l-4 border-blue-500 bg-gray-900/70 p-4 md:grid-cols-2"><label><span className={labelClass}>New expected return</span><input type="datetime-local" value={extension.expectedReturnAt} onChange={(event) => setExtension((value) => ({ ...value, expectedReturnAt: event.target.value }))} className={fieldClass} /></label><label><span className={labelClass}>Required extension note</span><input value={extension.note} onChange={(event) => setExtension((value) => ({ ...value, note: event.target.value }))} className={fieldClass} /></label><button disabled={busy} onClick={submitExtension} className="rounded bg-blue-700 px-4 py-2 font-semibold disabled:opacity-50">{busy ? 'Extending...' : 'Confirm extension'}</button></div>}
            {action === 'payment' && <div className="mt-5 grid grid-cols-1 gap-4 border-l-4 border-yellow-500 bg-gray-900/70 p-4 md:grid-cols-2 xl:grid-cols-4"><label><span className={labelClass}>Amount received (₹)</span><input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(event) => setPayment((value) => ({ ...value, amount: event.target.value }))} className={fieldClass} /></label><label><span className={labelClass}>Method</span><select value={payment.method} onChange={(event) => setPayment((value) => ({ ...value, method: event.target.value }))} className={fieldClass}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{humanize(method)}</option>)}</select></label><label><span className={labelClass}>Reference</span><input value={payment.reference} onChange={(event) => setPayment((value) => ({ ...value, reference: event.target.value }))} className={fieldClass} /></label><label><span className={labelClass}>Note</span><input value={payment.note} onChange={(event) => setPayment((value) => ({ ...value, note: event.target.value }))} className={fieldClass} /></label><button disabled={busy} onClick={submitPayment} className="rounded bg-yellow-700 px-4 py-2 font-semibold disabled:opacity-50">{busy ? 'Saving...' : 'Record payment'}</button></div>}
            {action === 'cancel' && <div className="mt-5 border-l-4 border-red-500 bg-gray-900/70 p-4"><label><span className={labelClass}>Required cancellation reason</span><textarea rows="3" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className={fieldClass} /></label><button disabled={busy} onClick={submitCancellation} className="mt-3 rounded bg-red-700 px-4 py-2 font-semibold disabled:opacity-50">{busy ? 'Cancelling...' : 'Confirm cancellation'}</button></div>}
            {action === 'return' && <div className="mt-5 space-y-5 border-l-4 border-green-500 bg-gray-900/70 p-4"><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"><label><span className={labelClass}>Physical return date and time</span><input type="datetime-local" value={returnForm.actualReturnAt} onChange={(event) => { setReturnForm((value) => ({ ...value, actualReturnAt: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label><label><span className={labelClass}>Other approved charges (₹)</span><input type="number" min="0" step="0.01" value={returnForm.otherCharges} onChange={(event) => { setReturnForm((value) => ({ ...value, otherCharges: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label><label><span className={labelClass}>Deposit to apply (₹)</span><input type="number" min="0" step="0.01" value={returnForm.depositApplied} onChange={(event) => { setReturnForm((value) => ({ ...value, depositApplied: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label><label><span className={labelClass}>Payment at return (₹)</span><input type="number" min="0" step="0.01" value={returnForm.paymentAmount} onChange={(event) => { setReturnForm((value) => ({ ...value, paymentAmount: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label><label><span className={labelClass}>Payment method</span><select value={returnForm.paymentMethod} onChange={(event) => { setReturnForm((value) => ({ ...value, paymentMethod: event.target.value })); setReturnPreview(null); }} className={fieldClass}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{humanize(method)}</option>)}</select></label><label><span className={labelClass}>Payment reference</span><input value={returnForm.paymentReference} onChange={(event) => { setReturnForm((value) => ({ ...value, paymentReference: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label><label><span className={labelClass}>Payment note</span><input value={returnForm.paymentNote} onChange={(event) => { setReturnForm((value) => ({ ...value, paymentNote: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label><label><span className={labelClass}>Settlement note</span><input value={returnForm.settlementNote} onChange={(event) => { setReturnForm((value) => ({ ...value, settlementNote: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label><label><span className={labelClass}>Machine return condition note</span><input value={returnForm.returnNote} onChange={(event) => { setReturnForm((value) => ({ ...value, returnNote: event.target.value })); setReturnPreview(null); }} className={fieldClass} /></label></div><div className="flex flex-wrap gap-3"><button disabled={busy} onClick={previewReturn} className={`${buttonClass} border-green-500 text-green-300`}>{busy ? 'Calculating...' : 'Preview settlement'}</button><button disabled={busy || !returnPreview} onClick={confirmReturn} className="rounded bg-green-700 px-4 py-2 font-semibold disabled:opacity-50">Confirm return</button></div>{returnPreview && <div aria-label="Return settlement preview" className="grid grid-cols-2 gap-4 border-y border-gray-700 py-4 md:grid-cols-4"><MoneyLine label="Final rent" value={returnPreview.finalRentalChargePaise} /><MoneyLine label={`Late charge · ${returnPreview.lateDays} day(s)`} value={returnPreview.lateChargePaise} tone={returnPreview.lateDays ? 'text-red-300' : ''} /><MoneyLine label="Deposit applied" value={returnPreview.depositAppliedPaise} /><MoneyLine label="Deposit refund" value={returnPreview.depositRefundPaise} tone="text-green-300" /><MoneyLine label="Rent payments" value={returnPreview.rentalPaymentsReceivedPaise} /><MoneyLine label="Rent refund" value={returnPreview.rentalPaymentRefundPaise} /><MoneyLine label="Other charges" value={returnPreview.otherApprovedChargesPaise} /><MoneyLine label="Remaining balance" value={returnPreview.remainingBalancePaise} tone={returnPreview.remainingBalancePaise ? 'text-yellow-300' : 'text-green-300'} /></div>}</div>}
          </section>}
        </div>}
      </div>
    </div>}
  </section>;
};

export default RentalManagementPanel;
