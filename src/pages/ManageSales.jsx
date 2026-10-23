import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { formatRentalMoney, paiseToInput, PAYMENT_METHODS, toLocalDateTimeInput } from '../utils/rentalForm';
import { buildMachineSalePayload, buildSalePaymentPayload, SALE_STATUSES } from '../utils/machineSaleForm';
import { formatIndiaDateTime, humanize } from '../utils/rentalManagement';

const fieldClass = 'w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-xs font-semibold uppercase text-gray-400';
const buttonClass = 'rounded border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50';
const nowInput = () => toLocalDateTimeInput(new Date());
const initialForm = () => ({
  customerId: '', machineId: '', soldAt: nowInput(), agreedSalePrice: '',
  initialPaymentAmount: '', paymentMethod: 'cash', paymentReference: '', paymentNote: '', notes: '',
});
const initialPayment = () => ({ amount: '', method: 'cash', reference: '', note: '' });
const statusStyles = {
  draft: 'border-yellow-500/50 bg-yellow-950/40 text-yellow-300',
  completed: 'border-green-500/50 bg-green-950/40 text-green-300',
  cancelled: 'border-gray-500/50 bg-gray-800 text-gray-300',
};

const StatusBadge = ({ status }) => <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold uppercase ${statusStyles[status]}`}>{status}</span>;
const customerLabel = (customer) => [customer.name, customer.phone, customer.email].filter(Boolean).join(' | ');
const machineLabel = (machine) => [machine.name, machine.brand, machine.model].filter(Boolean).join(' | ');

const ManageSales = () => {
  const [workspace, setWorkspace] = useState('manage');
  const [customers, setCustomers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState('');
  const [status, setStatus] = useState('draft');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('');
  const [payment, setPayment] = useState(initialPayment);
  const [cancelReason, setCancelReason] = useState('');
  const [refundConfirmed, setRefundConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const eligibleMachines = useMemo(() => machines.filter((machine) =>
    machine.condition === 'used'
    && ['sale', 'both'].includes(machine.availabilityType)
    && machine.availabilityStatus === 'available'
    && (machine.stock === undefined || machine.stock === null || Number(machine.stock) === 1)
  ), [machines]);

  const loadSetup = useCallback(async () => {
    try {
      const [customerResponse, machineResponse] = await Promise.all([
        api.get('/api/users', { params: { role: 'customer' } }),
        api.get('/api/products/inventory'),
      ]);
      setCustomers(customerResponse.data);
      setMachines(machineResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load customers and sale inventory');
    }
  }, []);

  const loadSales = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { status, page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/api/machine-sales', { params });
      setSales(data.sales);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load machine sales');
    } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { loadSetup(); }, [loadSetup]);
  useEffect(() => {
    const timer = setTimeout(loadSales, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadSales, search]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const selectMachine = (event) => {
    const machineId = event.target.value;
    const machine = machines.find((item) => item._id === machineId);
    setForm((current) => ({
      ...current,
      machineId,
      agreedSalePrice: machine?.salePrice ?? current.agreedSalePrice,
    }));
  };

  const resetForm = () => {
    setEditingId('');
    setForm(initialForm());
  };

  const saveSale = async (nextStatus) => {
    let payload;
    try { payload = buildMachineSalePayload(form, { status: editingId ? undefined : nextStatus, editing: Boolean(editingId) }); }
    catch (validationError) { return toast.error(validationError.message); }
    const completing = nextStatus === 'completed';
    const question = completing
      ? 'Complete this sale now? The selected machine will be marked Sold.'
      : editingId ? 'Save changes to this sale draft?' : 'Save this sale as an editable draft?';
    if (!window.confirm(question)) return;
    setBusy(nextStatus);
    try {
      if (editingId) {
        await api.patch(`/api/machine-sales/${editingId}`, payload);
        if (completing) await api.post(`/api/machine-sales/${editingId}/complete`, { soldAt: new Date(form.soldAt).toISOString() });
      } else {
        await api.post('/api/machine-sales', payload);
      }
      toast.success(completing ? 'Machine sale completed' : 'Sale draft saved');
      resetForm();
      setWorkspace('manage');
      setStatus(completing ? 'completed' : 'draft');
      setPage(1);
      await Promise.all([loadSetup(), loadSales()]);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not save machine sale');
    } finally { setBusy(''); }
  };

  const loadDetail = useCallback(async (saleId) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/api/machine-sales/${saleId}`);
      setSelected(data);
      return data;
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not load sale details');
      return null;
    } finally { setDetailLoading(false); }
  }, []);

  const openSale = async (sale) => {
    setSelected(sale);
    setAction('');
    await loadDetail(sale._id);
  };

  const refreshAfterAction = async (message) => {
    toast.success(message);
    setAction('');
    if (selected?._id) await loadDetail(selected._id);
    await Promise.all([loadSetup(), loadSales()]);
  };

  const editDraft = (sale) => {
    setEditingId(sale._id);
    setForm({
      customerId: sale.customer?._id || sale.customer,
      machineId: sale.machine?._id || sale.machine,
      soldAt: toLocalDateTimeInput(sale.soldAt || new Date()),
      agreedSalePrice: paiseToInput(sale.agreedSalePricePaise),
      initialPaymentAmount: '', paymentMethod: 'cash', paymentReference: '', paymentNote: '',
      notes: sale.notes || '',
    });
    setSelected(null);
    setWorkspace('create');
  };

  const completeDraft = async () => {
    if (!window.confirm('Complete this sale? The machine will be marked Sold and cannot be rented or sold again.')) return;
    setBusy('complete');
    try {
      await api.post(`/api/machine-sales/${selected._id}/complete`, { soldAt: new Date().toISOString() });
      await refreshAfterAction('Machine sale completed');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not complete sale'); }
    finally { setBusy(''); }
  };

  const submitPayment = async () => {
    let payload;
    try { payload = buildSalePaymentPayload(payment); }
    catch (validationError) { return toast.error(validationError.message); }
    setBusy('payment');
    try {
      await api.post(`/api/machine-sales/${selected._id}/payments`, payload);
      setPayment(initialPayment());
      await refreshAfterAction('Sale payment recorded');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not record payment'); }
    finally { setBusy(''); }
  };

  const cancelDraft = async () => {
    if (!cancelReason.trim()) return toast.error('Cancellation reason is required');
    if (selected.paymentsReceivedPaise > 0 && !refundConfirmed) return toast.error('Confirm that the received payment has been refunded');
    if (!window.confirm('Cancel this sale draft and preserve its history?')) return;
    setBusy('cancel');
    try {
      await api.post(`/api/machine-sales/${selected._id}/cancel`, {
        reason: cancelReason.trim(),
        ...(selected.paymentsReceivedPaise > 0 ? { refundConfirmed: true } : {}),
      });
      await refreshAfterAction('Sale draft cancelled');
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not cancel sale draft'); }
    finally { setBusy(''); }
  };

  const deleteDraft = async () => {
    if (!window.confirm('Permanently delete this unpaid sale draft?')) return;
    setBusy('delete');
    try {
      await api.delete(`/api/machine-sales/${selected._id}`);
      toast.success('Unpaid sale draft deleted');
      setSelected(null);
      await loadSales();
    } catch (requestError) { toast.error(requestError.response?.data?.message || 'Could not delete sale draft'); }
    finally { setBusy(''); }
  };

  const selectedMachine = machines.find((machine) => machine._id === form.machineId);
  const selectedCustomer = customers.find((customer) => customer._id === form.customerId);
  const canPay = selected && ['draft', 'completed'].includes(selected.status) && selected.remainingBalancePaise > 0;

  return <>
    <div className="mb-6"><h1 className="text-2xl font-bold text-white">Machine Sales</h1><p className="mt-1 text-sm text-gray-400">Sell individual second-hand machines and track customer balances.</p></div>
    <div className="mb-7 inline-flex rounded border border-gray-700 bg-gray-900 p-1" role="tablist" aria-label="Sales workspace">
      <button role="tab" aria-selected={workspace === 'manage'} onClick={() => setWorkspace('manage')} className={`rounded px-4 py-2 text-sm font-semibold ${workspace === 'manage' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Manage sales</button>
      <button role="tab" aria-selected={workspace === 'create'} onClick={() => setWorkspace('create')} className={`rounded px-4 py-2 text-sm font-semibold ${workspace === 'create' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Create & edit</button>
    </div>
    {error && <div role="alert" className="mb-5 border-l-4 border-red-500 bg-red-950/30 p-4 text-red-200">{error}</div>}

    {workspace === 'manage' ? <section>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h2 className="text-lg font-semibold text-white">Sale history</h2><p className="mt-1 text-sm text-gray-400">Completed sales may keep a balance for later payment.</p></div><label className="w-full xl:max-w-sm"><span className={labelClass}>Search</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Sale, customer, phone, machine" className={fieldClass} /></label></div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Sale status">{SALE_STATUSES.map((item) => <button key={item} role="tab" aria-selected={status === item} onClick={() => { setStatus(item); setPage(1); }} className={`shrink-0 rounded px-3 py-2 text-sm font-semibold capitalize ${status === item ? 'bg-blue-600 text-white' : 'border border-gray-600 text-gray-300'}`}>{item}</button>)}</div>
      {loading ? <p role="status" className="py-8 text-gray-400">Loading machine sales...</p> : sales.length === 0 ? <p className="border-y border-gray-700 py-10 text-center text-gray-400">No {status} sales found.</p> : <div className="divide-y divide-gray-700 border-y border-gray-700">{sales.map((sale) => <button key={sale._id} onClick={() => openSale(sale)} className="grid w-full grid-cols-1 gap-3 px-1 py-5 text-left hover:bg-gray-800/50 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto] xl:items-center"><div><p className="font-semibold text-white">{sale.machineSnapshot.name}</p><p className="text-xs text-gray-400">{sale.saleCode}</p></div><div><p className="text-sm text-white">{sale.customerSnapshot.name}</p><p className="text-xs text-gray-400">{sale.customerSnapshot.phone || sale.customerSnapshot.email || 'No contact'}</p></div><div><p className="text-xs uppercase text-gray-500">Sale price</p><p className="font-semibold">{formatRentalMoney(sale.agreedSalePricePaise)}</p></div><div><p className="text-xs uppercase text-gray-500">Balance</p><p className={sale.remainingBalancePaise ? 'text-yellow-300' : 'text-green-300'}>{formatRentalMoney(sale.remainingBalancePaise)}</p></div><StatusBadge status={sale.status} /></button>)}</div>}
      {pagination.pages > 1 && <div className="mt-5 flex items-center justify-between"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className={`${buttonClass} border-gray-600`}>Previous</button><span className="text-sm text-gray-400">Page {pagination.page} of {pagination.pages} · {pagination.total} sales</span><button disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className={`${buttonClass} border-gray-600`}>Next</button></div>}
    </section> : <section className="border-y border-gray-700 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-white">{editingId ? 'Edit sale draft' : 'New machine sale'}</h2>{editingId && <p className="mt-1 text-xs text-yellow-300">Existing payments are preserved. Record new payments from sale details.</p>}</div>{editingId && <button onClick={resetForm} className={`${buttonClass} border-gray-600`}>Cancel editing</button>}</div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2"><div><label htmlFor="sale-customer" className={labelClass}>Customer</label><select id="sale-customer" name="customerId" value={form.customerId} onChange={update} className={fieldClass}><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customerLabel(customer)}</option>)}</select>{selectedCustomer && <p className="mt-2 text-xs text-gray-400">{selectedCustomer.email || 'No email'} · {selectedCustomer.phone || 'No phone'}</p>}</div><div><label htmlFor="sale-machine" className={labelClass}>Available second-hand machine</label><select id="sale-machine" name="machineId" value={form.machineId} onChange={selectMachine} className={fieldClass}><option value="">Select machine</option>{eligibleMachines.map((machine) => <option key={machine._id} value={machine._id}>{machineLabel(machine)}</option>)}{editingId && selectedMachine && !eligibleMachines.some((item) => item._id === selectedMachine._id) && <option value={selectedMachine._id}>{machineLabel(selectedMachine)} (draft selection)</option>}</select>{selectedMachine && <p className="mt-2 text-xs text-gray-400">Listed sale price: {selectedMachine.salePrice ? `₹${selectedMachine.salePrice}` : 'Not available'}</p>}</div><label><span className={labelClass}>Sale date and time</span><input type="datetime-local" name="soldAt" value={form.soldAt} onChange={update} className={fieldClass} /></label><label><span className={labelClass}>Agreed sale price (₹)</span><input type="number" min="0.01" step="0.01" name="agreedSalePrice" value={form.agreedSalePrice} onChange={update} className={fieldClass} /></label></div>
      {!editingId && <div className="mt-6 border-t border-gray-700 pt-5"><h3 className="mb-4 font-medium text-white">Initial payment</h3><div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"><label><span className={labelClass}>Amount received (₹)</span><input type="number" min="0" step="0.01" name="initialPaymentAmount" value={form.initialPaymentAmount} onChange={update} className={fieldClass} /></label><label><span className={labelClass}>Method</span><select name="paymentMethod" value={form.paymentMethod} onChange={update} className={fieldClass}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{humanize(method)}</option>)}</select></label><label><span className={labelClass}>Reference</span><input name="paymentReference" value={form.paymentReference} onChange={update} className={fieldClass} /></label><label><span className={labelClass}>Payment note</span><input name="paymentNote" value={form.paymentNote} onChange={update} className={fieldClass} /></label></div></div>}
      <label className="mt-5 block"><span className={labelClass}>Sale notes</span><textarea rows="3" name="notes" value={form.notes} onChange={update} className={fieldClass} /></label><div className="mt-6 flex flex-wrap gap-3"><button disabled={Boolean(busy)} onClick={() => saveSale('draft')} className={`${buttonClass} border-gray-500`}>{busy === 'draft' ? 'Saving...' : 'Save draft'}</button><button disabled={Boolean(busy)} onClick={() => saveSale('completed')} className="rounded bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy === 'completed' ? 'Completing...' : editingId ? 'Save and complete' : 'Complete sale'}</button></div>
    </section>}

    {selected && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Sale details"><div className="my-4 w-full max-w-4xl rounded border border-gray-700 bg-gray-950 shadow-2xl"><header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-700 bg-gray-950 p-5"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-white">{selected.machineSnapshot.name}</h2><StatusBadge status={selected.status} /></div><p className="mt-1 text-sm text-gray-400">{selected.saleCode}</p></div><button onClick={() => setSelected(null)} className={`${buttonClass} border-gray-600`} aria-label="Close sale details">Close</button></header>{detailLoading ? <p role="status" className="p-8 text-gray-400">Loading complete sale details...</p> : <div className="space-y-8 p-5 sm:p-7">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2"><section><h3 className="mb-3 font-semibold text-white">Customer</h3><p>{selected.customerSnapshot.name}</p><p className="text-sm text-gray-400">{selected.customerSnapshot.phone || 'No phone'}</p><p className="text-sm text-gray-400">{selected.customerSnapshot.email || 'No email'}</p><p className="text-sm text-gray-400">{selected.customerSnapshot.address || 'No address'}</p></section><section><h3 className="mb-3 font-semibold text-white">Machine</h3><p>{selected.machineSnapshot.name}</p><p className="text-sm text-gray-400">{[selected.machineSnapshot.brand, selected.machineSnapshot.model, selected.machineSnapshot.category].filter(Boolean).join(' · ') || 'No additional details'}</p><p className="mt-2 text-sm text-gray-400">Sold at: {formatIndiaDateTime(selected.soldAt)}</p></section></div>
      <section><h3 className="mb-3 font-semibold text-white">Financial summary</h3><dl className="grid grid-cols-2 gap-5 md:grid-cols-4"><div><dt className={labelClass}>Sale price</dt><dd className="font-semibold">{formatRentalMoney(selected.agreedSalePricePaise)}</dd></div><div><dt className={labelClass}>Payments received</dt><dd className="font-semibold text-green-300">{formatRentalMoney(selected.paymentsReceivedPaise)}</dd></div><div><dt className={labelClass}>Remaining balance</dt><dd className={`font-semibold ${selected.remainingBalancePaise ? 'text-yellow-300' : 'text-green-300'}`}>{formatRentalMoney(selected.remainingBalancePaise)}</dd></div><div><dt className={labelClass}>Payments refunded</dt><dd className="font-semibold">{formatRentalMoney(selected.paymentsRefundedPaise)}</dd></div></dl></section>
      <section><h3 className="mb-3 font-semibold text-white">Notes</h3><p className="text-sm text-gray-300">{selected.notes || 'No sale notes.'}</p>{selected.cancellationReason && <p className="mt-3 text-sm text-red-300">Cancellation: {selected.cancellationReason}</p>}</section>
      <section><h3 className="mb-3 font-semibold text-white">Payments</h3>{selected.payments?.length ? <div className="divide-y divide-gray-700">{selected.payments.map((item, index) => <div key={item._id || index} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-4"><strong>{formatRentalMoney(item.amountPaise)}</strong><span className="text-sm capitalize">{humanize(item.method)}</span><span className="text-sm text-gray-400">{formatIndiaDateTime(item.paidAt)}</span><span className="text-sm text-gray-400">{item.reference || item.note || 'No reference'}</span></div>)}</div> : <p className="text-sm text-gray-400">No payments recorded.</p>}</section>
      <section><h3 className="mb-3 font-semibold text-white">Audit history</h3>{selected.auditHistory?.length ? <div className="divide-y divide-gray-700">{[...selected.auditHistory].reverse().map((item) => <div key={item._id} className="py-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm capitalize">{humanize(item.action)}</strong><span className="text-xs text-gray-500">{formatIndiaDateTime(item.performedAt)}</span></div><p className="mt-1 text-sm text-gray-400">{item.note || 'No note'}</p></div>)}</div> : <p className="text-sm text-gray-400">No audit entries found.</p>}</section>
      {(selected.status === 'draft' || canPay) && <section className="border-t border-gray-700 pt-6"><h3 className="mb-4 font-semibold text-white">Actions</h3><div className="flex flex-wrap gap-2">{selected.status === 'draft' && <><button onClick={() => editDraft(selected)} className={`${buttonClass} border-blue-500/60 text-blue-300`}>Edit draft</button><button disabled={Boolean(busy)} onClick={completeDraft} className={`${buttonClass} border-green-500/60 text-green-300`}>Complete sale</button><button onClick={() => { setAction('cancel'); setCancelReason(''); setRefundConfirmed(false); }} className={`${buttonClass} border-red-500/60 text-red-300`}>Cancel draft</button>{selected.paymentsReceivedPaise === 0 && <button disabled={Boolean(busy)} onClick={deleteDraft} className={`${buttonClass} border-red-500/60 text-red-300`}>Delete unpaid draft</button>}</>}{canPay && <button onClick={() => { setAction('payment'); setPayment(initialPayment()); }} className={`${buttonClass} border-yellow-500/60 text-yellow-300`}>Add payment</button>}</div>
        {action === 'payment' && <div className="mt-5 grid grid-cols-1 gap-4 border-l-4 border-yellow-500 bg-gray-900/70 p-4 md:grid-cols-2 xl:grid-cols-4"><label><span className={labelClass}>Amount received (₹)</span><input type="number" min="0.01" step="0.01" value={payment.amount} onChange={(event) => setPayment((value) => ({ ...value, amount: event.target.value }))} className={fieldClass} /></label><label><span className={labelClass}>Payment method</span><select value={payment.method} onChange={(event) => setPayment((value) => ({ ...value, method: event.target.value }))} className={fieldClass}>{PAYMENT_METHODS.map((method) => <option key={method} value={method}>{humanize(method)}</option>)}</select></label><label><span className={labelClass}>Payment reference</span><input value={payment.reference} onChange={(event) => setPayment((value) => ({ ...value, reference: event.target.value }))} className={fieldClass} /></label><label><span className={labelClass}>Payment note</span><input value={payment.note} onChange={(event) => setPayment((value) => ({ ...value, note: event.target.value }))} className={fieldClass} /></label><button disabled={Boolean(busy)} onClick={submitPayment} className="rounded bg-yellow-700 px-4 py-2 font-semibold disabled:opacity-50">{busy === 'payment' ? 'Saving...' : 'Record payment'}</button></div>}
        {action === 'cancel' && <div className="mt-5 border-l-4 border-red-500 bg-gray-900/70 p-4"><label><span className={labelClass}>Required cancellation reason</span><textarea rows="3" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} className={fieldClass} /></label>{selected.paymentsReceivedPaise > 0 && <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={refundConfirmed} onChange={(event) => setRefundConfirmed(event.target.checked)} className="mt-1" /><span>I confirm {formatRentalMoney(selected.paymentsReceivedPaise)} received for this draft has been refunded to the customer.</span></label>}<button disabled={Boolean(busy)} onClick={cancelDraft} className="mt-4 rounded bg-red-700 px-4 py-2 font-semibold disabled:opacity-50">{busy === 'cancel' ? 'Cancelling...' : 'Confirm cancellation'}</button></div>}
      </section>}
    </div>}</div></div>}
  </>;
};

export default ManageSales;
