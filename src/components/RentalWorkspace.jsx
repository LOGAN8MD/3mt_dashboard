import { confirmAction } from '../utils/confirmationDialog';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import RentalManagementPanel from './RentalManagementPanel';
import RentalReminderEditor from './RentalReminderEditor';
import api from '../utils/axiosInstance';
import {
  PAYMENT_METHODS,
  RENTAL_PERIODS,
  buildRentalPayload,
  formatRentalMoney,
  paiseToInput,
  toLocalDateTimeInput,
} from '../utils/rentalForm';
import {
  buildRentalReminderSettings,
  reminderSettingsToForm,
} from '../utils/rentalReminderForm';

const dateInput = (offsetMs = 0) => toLocalDateTimeInput(new Date(Date.now() + offsetMs));
const initialForm = () => ({
  machineId: '', customerId: '', handoverAt: dateInput(),
  expectedReturnAt: dateInput(24 * 60 * 60 * 1000), billingPeriod: 'day',
  agreedRate: '', dailyLateRate: '', securityDeposit: '', initialPaymentAmount: '',
  paymentMethod: 'cash', paymentReference: '', paymentNote: '', notes: '',
  reminderSettings: { mode: 'default', reminders: [] },
});

const fieldClass = 'w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-xs font-semibold uppercase text-gray-400';
const customerLabel = (customer) => [customer.name, customer.phone, customer.email].filter(Boolean).join(' | ');
const machineLabel = (machine) => [machine.name, machine.brand, machine.model].filter(Boolean).join(' | ');
const workspaceFromLocation = () => new URLSearchParams(window.location.search).get('workspace') === 'create'
  ? 'create'
  : 'manage';

const RentalWorkspace = ({ fixedWorkspace = '', showHeader = true }) => {
  const [workspace, setWorkspace] = useState(workspaceFromLocation);
  const activeWorkspace = fixedWorkspace || workspace;
  const [form, setForm] = useState(initialForm);
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [quote, setQuote] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(activeWorkspace === 'create');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');

  const eligibleMachines = useMemo(() => machines.filter((machine) =>
    machine.condition === 'used' &&
    ['rent', 'both'].includes(machine.availabilityType) &&
    machine.availabilityStatus === 'available' &&
    (machine.stock === undefined || machine.stock === null || Number(machine.stock) === 1)
  ), [machines]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [customerResponse, machineResponse, draftResponse] = await Promise.all([
        api.get('/api/users', { params: { role: 'customer' } }),
        api.get('/api/products/inventory'),
        api.get('/api/rentals', { params: { status: 'draft', limit: 100 } }),
      ]);
      setCustomers(customerResponse.data);
      setMachines(machineResponse.data);
      setDrafts(draftResponse.data.rentals);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load rental setup data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeWorkspace === 'create') load();
  }, [activeWorkspace, load]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setQuote(null);
    setSaveError('');
  };

  const selectMachine = (event) => {
    const machineId = event.target.value;
    const machine = machines.find((item) => item._id === machineId);
    setForm((current) => ({
      ...current,
      machineId,
      billingPeriod: machine?.rentPeriod || current.billingPeriod,
      agreedRate: machine?.rentalPrice ?? current.agreedRate,
      securityDeposit: machine?.securityDeposit ?? current.securityDeposit,
      dailyLateRate: '',
    }));
    setQuote(null);
    setSaveError('');
  };

  const getPayload = (status, { includeReminders = true } = {}) => {
    try {
      const payload = buildRentalPayload(form, status);
      if (includeReminders) {
        const customer = customers.find((item) => item._id === form.customerId);
        payload.reminderSettings = buildRentalReminderSettings(form.reminderSettings, {
          customer,
          handoverAt: form.handoverAt,
          expectedReturnAt: form.expectedReturnAt,
        });
      }
      setSaveError('');
      return payload;
    } catch (validationError) {
      setSaveError(validationError.message);
      toast.error(validationError.message);
      return null;
    }
  };

  const previewQuote = async () => {
    const payload = getPayload(undefined, { includeReminders: false });
    if (!payload) return;
    setBusy('quote');
    try {
      const { data } = await api.post('/api/rentals/quote', {
        handoverAt: payload.handoverAt,
        expectedReturnAt: payload.expectedReturnAt,
        billingPeriod: payload.billingPeriod,
        agreedRatePaise: payload.agreedRatePaise,
      });
      setQuote(data);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not calculate quote');
    } finally { setBusy(''); }
  };

  const reset = () => {
    setForm(initialForm());
    setEditingId('');
    setQuote(null);
    setSaveError('');
  };

  const save = async (status) => {
    const payload = getPayload(editingId ? undefined : status);
    if (!payload) return;
    if (editingId && !payload.initialPayment) {
      payload.initialPayment = { amountPaise: 0 };
    }
    const activeNow = status === 'active';
    const message = activeNow
      ? 'Activate this rental now? The machine will be marked On Rent and customer reminders will be created.'
      : editingId ? 'Save changes to this draft?' : 'Save this rental as an editable draft?';
    if (!await confirmAction(message)) return;
    setBusy(status);
    try {
      if (editingId) {
        await api.patch(`/api/rentals/${editingId}`, payload);
        if (activeNow) await api.post(`/api/rentals/${editingId}/activate`);
      } else {
        await api.post('/api/rentals', payload);
      }
      toast.success(activeNow ? 'Rental activated and reminders created' : 'Rental draft saved');
      reset();
      await load();
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not save rental';
      setSaveError(message);
      toast.error(message);
    } finally { setBusy(''); }
  };

  const activateDraft = async (draft) => {
    if (!await confirmAction(`Activate ${draft.rentalCode}? The machine will be marked On Rent and customer reminders will be created.`)) return;
    setBusy(draft._id);
    try {
      await api.post(`/api/rentals/${draft._id}/activate`);
      toast.success('Rental activated and reminders created');
      if (editingId === draft._id) reset();
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not activate draft');
    } finally { setBusy(''); }
  };

  const editDraft = (draft) => {
    const payment = draft.payments?.[0];
    setEditingId(draft._id);
    setForm({
      machineId: draft.machine?._id || draft.machine,
      customerId: draft.customer?._id || draft.customer,
      handoverAt: toLocalDateTimeInput(draft.handoverAt),
      expectedReturnAt: toLocalDateTimeInput(draft.expectedReturnAt),
      billingPeriod: draft.billingPeriod,
      agreedRate: paiseToInput(draft.agreedRatePaise),
      dailyLateRate: paiseToInput(draft.dailyLateRatePaise),
      securityDeposit: paiseToInput(draft.securityDepositReceivedPaise),
      initialPaymentAmount: paiseToInput(payment?.amountPaise || 0),
      paymentMethod: payment?.method || 'cash',
      paymentReference: payment?.reference || '',
      paymentNote: payment?.note || '',
      notes: draft.notes || '',
      reminderSettings: reminderSettingsToForm(draft.reminderSettings),
    });
    setQuote({
      plannedRentalChargePaise: draft.plannedRentalChargePaise,
      derivedDailyRatePaise: draft.derivedDailyRatePaise,
      plannedBillablePeriods: draft.plannedBillablePeriods,
      plannedExtraDays: draft.plannedExtraDays,
    });
    setSaveError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteDraft = async (draft) => {
    if (!await confirmAction(`Delete draft ${draft.rentalCode}? This cannot be undone.`)) return;
    setBusy(draft._id);
    try {
      await api.delete(`/api/rentals/${draft._id}`);
      toast.success('Draft deleted');
      if (editingId === draft._id) reset();
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not delete draft');
    } finally { setBusy(''); }
  };

  const selectedMachine = machines.find((machine) => machine._id === form.machineId);
  const selectedCustomer = customers.find((customer) => customer._id === form.customerId);
  let reminderValidationError = '';
  try {
    buildRentalReminderSettings(form.reminderSettings, {
      customer: selectedCustomer,
      handoverAt: form.handoverAt,
      expectedReturnAt: form.expectedReturnAt,
    });
  } catch (validationError) {
    reminderValidationError = validationError.message;
  }

  return <>
    {showHeader && <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">Rentals</h1>
      <p className="mt-1 text-sm text-gray-400">Create rentals, monitor deadlines, and complete settlements.</p>
    </div>}
    {!fixedWorkspace && <div className="mb-7 inline-flex rounded border border-gray-700 bg-gray-900 p-1" role="tablist" aria-label="Rental workspace">
      <button role="tab" aria-selected={activeWorkspace === 'manage'} onClick={() => setWorkspace('manage')} className={`rounded px-4 py-2 text-sm font-semibold ${activeWorkspace === 'manage' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Manage rentals</button>
      <button role="tab" aria-selected={activeWorkspace === 'create'} onClick={() => setWorkspace('create')} className={`rounded px-4 py-2 text-sm font-semibold ${activeWorkspace === 'create' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Create & drafts</button>
    </div>}
    {activeWorkspace === 'manage' ? <RentalManagementPanel /> : <>
    {error && <div role="alert" className="mb-5 border-l-4 border-red-500 bg-red-950/30 p-4 text-red-200">{error} <button onClick={load} className="ml-3 underline">Retry</button></div>}
    {loading ? <p role="status" className="text-gray-400">Loading customers, machines, and drafts...</p> : <>
      <section className="border-y border-gray-700 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit rental draft' : 'New rental'}</h2>
          {editingId && <button onClick={reset} className="rounded border border-gray-600 px-3 py-2 text-sm">Cancel editing</button>}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div>
            <label htmlFor="rental-customer" className={labelClass}>Customer</label>
            <select id="rental-customer" name="customerId" value={form.customerId} onChange={update} className={fieldClass}>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer._id} value={customer._id}>{customerLabel(customer)}</option>)}
            </select>
            {selectedCustomer && <p className="mt-2 text-xs text-gray-400">Email: {selectedCustomer.email || 'Missing'} · Phone: {selectedCustomer.phone || 'Missing'}</p>}
          </div>
          <div>
            <label htmlFor="rental-machine" className={labelClass}>Available second-hand machine</label>
            <select id="rental-machine" name="machineId" value={form.machineId} onChange={selectMachine} className={fieldClass}>
              <option value="">Select machine</option>
              {eligibleMachines.map((machine) => <option key={machine._id} value={machine._id}>{machineLabel(machine)}</option>)}
              {editingId && selectedMachine && !eligibleMachines.some((item) => item._id === selectedMachine._id) && <option value={selectedMachine._id}>{machineLabel(selectedMachine)} (draft selection)</option>}
            </select>
            {selectedMachine && <p className="mt-2 text-xs text-gray-400">Listed rate: {selectedMachine.rentalPrice ? `₹${selectedMachine.rentalPrice} / ${selectedMachine.rentPeriod}` : 'Not available'}</p>}
          </div>
          <div><label className={labelClass}>Handover date and time</label><input type="datetime-local" name="handoverAt" value={form.handoverAt} onChange={update} className={fieldClass} /></div>
          <div><label className={labelClass}>Expected return date and time</label><input type="datetime-local" name="expectedReturnAt" value={form.expectedReturnAt} onChange={update} className={fieldClass} /></div>
          <div><label className={labelClass}>Billing period</label><select name="billingPeriod" value={form.billingPeriod} onChange={update} className={fieldClass}>{RENTAL_PERIODS.map((period) => <option key={period} value={period}>Per {period}</option>)}</select></div>
          <div><label className={labelClass}>Agreed rate (₹)</label><input type="number" min="0.01" step="0.01" name="agreedRate" value={form.agreedRate} onChange={update} className={fieldClass} /></div>
          <div><label className={labelClass}>Daily late rate (₹)</label><input type="number" min="0.01" step="0.01" name="dailyLateRate" value={form.dailyLateRate} onChange={update} placeholder="Uses calculated daily rate when empty" className={fieldClass} /></div>
          <div><label className={labelClass}>Security deposit received (₹)</label><input type="number" min="0" step="0.01" name="securityDeposit" value={form.securityDeposit} onChange={update} className={fieldClass} /></div>
        </div>

        <div className="mt-6 border-t border-gray-700 pt-5">
          <h3 className="mb-4 font-medium text-white">Initial rental payment</h3>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div><label className={labelClass}>Amount received (₹)</label><input type="number" min="0" step="0.01" name="initialPaymentAmount" value={form.initialPaymentAmount} onChange={update} className={fieldClass} /></div>
            <div><label className={labelClass}>Payment method</label><select name="paymentMethod" value={form.paymentMethod} onChange={update} className={fieldClass}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method.replaceAll('_', ' ')}</option>)}</select></div>
            <div><label className={labelClass}>Reference</label><input name="paymentReference" value={form.paymentReference} onChange={update} className={fieldClass} /></div>
            <div><label className={labelClass}>Payment note</label><input name="paymentNote" value={form.paymentNote} onChange={update} className={fieldClass} /></div>
          </div>
        </div>
        <div className="mt-5"><label className={labelClass}>Rental notes</label><textarea name="notes" rows="3" value={form.notes} onChange={update} className={fieldClass} /></div>

        <RentalReminderEditor
          settings={form.reminderSettings}
          onChange={(reminderSettings) => {
            setForm((current) => ({ ...current, reminderSettings }));
            setSaveError('');
          }}
          customer={selectedCustomer}
          expectedReturnAt={form.expectedReturnAt}
          validationError={selectedCustomer ? reminderValidationError : ''}
        />

        <div className="mt-6 flex flex-wrap gap-3">
          <button disabled={Boolean(busy)} onClick={previewQuote} className="rounded border border-blue-500 px-4 py-2 text-blue-300 disabled:opacity-50">{busy === 'quote' ? 'Calculating...' : 'Calculate quote'}</button>
          <button disabled={Boolean(busy)} onClick={() => save('draft')} className="rounded border border-gray-500 px-4 py-2 disabled:opacity-50">{busy === 'draft' ? 'Saving...' : 'Save draft'}</button>
          <button disabled={Boolean(busy)} onClick={() => save('active')} className="rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-600 disabled:opacity-50">{busy === 'active' ? 'Activating...' : editingId ? 'Save and activate' : 'Confirm rental'}</button>
        </div>
        {saveError && saveError !== reminderValidationError && <p role="alert" className="mt-4 border-l-4 border-red-500 bg-red-950/30 p-3 text-sm text-red-200">{saveError}</p>}
        {quote && <div className="mt-6 grid grid-cols-2 gap-4 border-y border-gray-700 py-4 md:grid-cols-4">
          <div><span className={labelClass}>Planned charge</span><strong className="text-green-300">{formatRentalMoney(quote.plannedRentalChargePaise)}</strong></div>
          <div><span className={labelClass}>Derived daily rate</span><strong>{formatRentalMoney(quote.derivedDailyRatePaise)}</strong></div>
          <div><span className={labelClass}>Full periods</span><strong>{quote.plannedBillablePeriods}</strong></div>
          <div><span className={labelClass}>Extra days</span><strong>{quote.plannedExtraDays}</strong></div>
        </div>}
      </section>

      <section className="py-7">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-white">Rental drafts</h2><span className="text-sm text-gray-400">{drafts.length} draft{drafts.length === 1 ? '' : 's'}</span></div>
        {drafts.length === 0 ? <p className="py-8 text-gray-400">No rental drafts.</p> : <div className="divide-y divide-gray-700">
          {drafts.map((draft) => <article key={draft._id} className="grid grid-cols-1 gap-4 py-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
            <div><h3 className="font-semibold text-white">{draft.machineSnapshot.name}</h3><p className="text-sm text-gray-400">{draft.rentalCode}</p></div>
            <div><p className="text-sm text-white">{draft.customerSnapshot.name}</p><p className="text-xs text-gray-400">{draft.customerSnapshot.phone || draft.customerSnapshot.email || 'No contact'}</p></div>
            <div><p className="text-sm">{formatRentalMoney(draft.plannedRentalChargePaise)}</p><p className="text-xs text-gray-400">Return: {new Date(draft.expectedReturnAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={Boolean(busy)} onClick={() => editDraft(draft)} className="rounded border border-blue-500/60 px-3 py-2 text-sm text-blue-300 disabled:opacity-50">Edit</button>
              <button disabled={Boolean(busy)} onClick={() => activateDraft(draft)} className="rounded border border-green-500/60 px-3 py-2 text-sm text-green-300 disabled:opacity-50">Activate</button>
              <button disabled={Boolean(busy)} onClick={() => deleteDraft(draft)} className="rounded border border-red-500/60 px-3 py-2 text-sm text-red-300 disabled:opacity-50">Delete</button>
            </div>
          </article>)}
        </div>}
      </section>
    </>}
    </>}
  </>;
};

export default RentalWorkspace;
