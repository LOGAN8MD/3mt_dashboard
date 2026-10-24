import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { toLocalDateTimeInput } from '../utils/rentalForm';
import {
  applySharedContent,
  buildStandaloneReminderPayload,
  createStandaloneReminderForm,
} from '../utils/standaloneReminderForm';
import { formatReminderTimeIST } from '../utils/rentalReminderForm';
import {
  CUSTOM_MESSAGE_TEMPLATE,
  renderStandaloneReminderTemplate,
  standaloneReminderTemplates,
  toSharedMessageFields,
} from '../utils/standaloneReminderTemplates';
import ReminderRowsEditor from './ReminderRowsEditor';

const dateInput = (offsetMs = 0) => toLocalDateTimeInput(new Date(Date.now() + offsetMs));
const fieldClass = 'w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-1 block text-xs font-semibold uppercase text-gray-400';
const customerLabel = (customer) => [customer.name, customer.phone, customer.email].filter(Boolean).join(' | ');
const productLabel = (product) => [product.name, product.brand, product.model].filter(Boolean).join(' | ');

const StandaloneReminderForm = () => {
  const [form, setForm] = useState(() => createStandaloneReminderForm(dateInput));
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [createdPlan, setCreatedPlan] = useState(null);
  const [messageTemplate, setMessageTemplate] = useState(CUSTOM_MESSAGE_TEMPLATE);
  const [templateDetails, setTemplateDetails] = useState({ machineName: '', amount: '' });

  const loadOptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [customerResponse, productResponse] = await Promise.all([
        api.get('/api/users', { params: { role: 'customer' } }),
        api.get('/api/products/inventory'),
      ]);
      setCustomers(customerResponse.data);
      setProducts(productResponse.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load customers and products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOptions(); }, [loadOptions]);

  const selectedCustomer = customers.find((item) => item._id === form.customerId);
  const selectedProduct = products.find((item) => item._id === form.productId);
  const validationError = useMemo(() => {
    if (!selectedCustomer) return '';
    try {
      buildStandaloneReminderPayload(form, selectedCustomer);
      return '';
    } catch (validationFailure) {
      return validationFailure.message;
    }
  }, [form, selectedCustomer]);

  const change = (patch) => {
    setForm((current) => ({ ...current, ...patch }));
    setPreview(null);
    setCreatedPlan(null);
    setError('');
  };

  const applyTemplate = (templateId, details = templateDetails) => {
    setMessageTemplate(templateId);
    change(toSharedMessageFields(renderStandaloneReminderTemplate(templateId, {
      ...details,
      machineName: details.machineName || selectedProduct?.name,
    })));
  };

  const changeTemplateDetails = (patch) => {
    const nextDetails = { ...templateDetails, ...patch };
    setTemplateDetails(nextDetails);
    applyTemplate(messageTemplate, nextDetails);
  };

  const payload = () => {
    try {
      const value = buildStandaloneReminderPayload(form, selectedCustomer);
      setError('');
      return value;
    } catch (validationFailure) {
      setError(validationFailure.message);
      toast.error(validationFailure.message);
      return null;
    }
  };

  const previewPlan = async () => {
    const request = payload();
    if (!request) return;
    setBusy('preview');
    try {
      const { data } = await api.post('/api/reminders/plans/preview', request);
      setPreview(data);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not preview reminder plan';
      setError(message);
      toast.error(message);
    } finally {
      setBusy('');
    }
  };

  const createPlan = async () => {
    const request = payload();
    if (!request || !window.confirm(`Create ${request.reminders.length} scheduled reminder${request.reminders.length === 1 ? '' : 's'} for ${selectedCustomer.name}?`)) return;
    setBusy('create');
    try {
      const { data } = await api.post('/api/reminders/plans', request);
      setCreatedPlan(data);
      setPreview(null);
      toast.success('Custom reminder plan created');
      setForm((current) => ({ ...current, submissionKey: `${current.submissionKey}-complete` }));
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Could not create reminder plan';
      setError(message);
      toast.error(message);
    } finally {
      setBusy('');
    }
  };

  if (loading) return <p role="status" className="mt-6 text-sm text-gray-400">Loading customers and product context...</p>;

  return (
    <div className="mt-6 border-t border-gray-800 pt-6">
      {error && <div role="alert" className="mb-5 border-l-4 border-red-500 bg-red-950/30 p-4 text-sm text-red-200">{error} {!customers.length && <button type="button" onClick={loadOptions} className="ml-3 underline">Retry</button>}</div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="standalone-customer" className={labelClass}>Customer</label>
          <select id="standalone-customer" value={form.customerId} onChange={(event) => change({ customerId: event.target.value })} className={fieldClass}>
            <option value="">Select customer</option>
            {customers.map((customer) => <option key={customer._id} value={customer._id}>{customerLabel(customer)}</option>)}
          </select>
          {selectedCustomer && <p className="mt-2 text-xs text-gray-400">Email: {selectedCustomer.email || 'Missing'} · WhatsApp: {selectedCustomer.phone || 'Missing'}</p>}
        </div>
        <div>
          <label htmlFor="standalone-product" className={labelClass}>Product or machine context (optional)</label>
          <select id="standalone-product" value={form.productId} onChange={(event) => change({ productId: event.target.value })} className={fieldClass}>
            <option value="">No product context</option>
            {products.map((product) => <option key={product._id} value={product._id}>{productLabel(product)}</option>)}
          </select>
          <p className="mt-2 text-xs text-gray-500">Context only. Product availability and stock will not change.</p>
        </div>
        <div><label className={labelClass}>Schedule start (IST)</label><input aria-label="Schedule start" type="datetime-local" value={form.startAt} onChange={(event) => change({ startAt: event.target.value })} className={fieldClass} /></div>
        <div><label className={labelClass}>Schedule end (IST)</label><input aria-label="Schedule end" type="datetime-local" value={form.endAt} onChange={(event) => change({ endAt: event.target.value })} className={fieldClass} /></div>
      </div>

      <section className="mt-7 border-t border-gray-700 pt-6" aria-labelledby="shared-message-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h3 id="shared-message-heading" className="font-medium text-white">Shared starting message</h3><p className="mt-1 text-sm text-gray-400">Apply this content to every row, then customize individual reminders below.</p></div>
          <button type="button" onClick={() => change(applySharedContent(form))} className="rounded border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-300">Apply to all reminders</button>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label htmlFor="standalone-message-template" className={labelClass}>Message template</label>
            <select id="standalone-message-template" value={messageTemplate} onChange={(event) => applyTemplate(event.target.value)} className={fieldClass}>
              {standaloneReminderTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
            </select>
          </div>
          {messageTemplate === 'machine-ready-with-amount' && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="template-machine-name" className={labelClass}>Machine name</label>
              <input id="template-machine-name" value={templateDetails.machineName} onChange={(event) => changeTemplateDetails({ machineName: event.target.value })} placeholder={selectedProduct?.name || 'Machine name'} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="template-amount" className={labelClass}>Amount (₹)</label>
              <input id="template-amount" type="number" min="0" step="0.01" value={templateDetails.amount} onChange={(event) => changeTemplateDetails({ amount: event.target.value })} placeholder="0.00" className={fieldClass} />
            </div>
          </div>}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div><label className={labelClass}>English subject (optional)</label><input value={form.sharedSubjectEnglish} maxLength="200" onChange={(event) => change({ sharedSubjectEnglish: event.target.value })} className={fieldClass} /></div>
          <div><label className={labelClass}>Hindi subject (optional)</label><input value={form.sharedSubjectHindi} maxLength="200" onChange={(event) => change({ sharedSubjectHindi: event.target.value })} className={fieldClass} /></div>
          <div><label className={labelClass}>English message</label><textarea aria-label="Shared English message" rows="4" value={form.sharedBodyEnglish} maxLength="5000" onChange={(event) => change({ sharedBodyEnglish: event.target.value })} className={fieldClass} /></div>
          <div><label className={labelClass}>Hindi message</label><textarea aria-label="Shared Hindi message" rows="4" value={form.sharedBodyHindi} maxLength="5000" onChange={(event) => change({ sharedBodyHindi: event.target.value })} className={fieldClass} /></div>
        </div>
      </section>

      <section className="mt-7 border-t border-gray-700 pt-6" aria-labelledby="custom-reminder-rows-heading">
        <h3 id="custom-reminder-rows-heading" className="font-medium text-white">Reminder schedule</h3>
        <p className="mb-5 mt-1 text-sm text-gray-400">Each reminder is scheduled before the selected end time and displayed in IST.</p>
        <ReminderRowsEditor reminders={form.reminders} onChange={(reminders) => change({ reminders })} endAt={form.endAt} />
        {validationError && <p role="alert" className="mt-4 border-l-4 border-red-500 bg-red-950/30 p-3 text-sm text-red-200">{validationError}</p>}
      </section>

      {preview && <section className="mt-7 border-y border-gray-700 py-5" aria-labelledby="plan-preview-heading">
        <h3 id="plan-preview-heading" className="font-medium text-white">Plan preview</h3>
        <p className="mt-1 text-sm text-gray-400">{selectedCustomer?.name} · {selectedProduct ? productLabel(selectedProduct) : 'No product context'}</p>
        <div className="mt-4 divide-y divide-gray-800">
          {preview.reminders.map((row, index) => <div key={`${row.offsetMinutes}-${index}`} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr_auto]"><strong className="text-sm">Reminder {index + 1}</strong><span className="text-sm text-gray-300">{formatReminderTimeIST(row.scheduledAt)} IST</span><span className="text-xs uppercase text-blue-300">{row.channels.join(' + ')}</span></div>)}
        </div>
      </section>}

      {createdPlan && <p role="status" className="mt-6 border-l-4 border-green-500 bg-green-950/30 p-4 text-sm text-green-200">Plan {createdPlan.planCode || ''} was created successfully.</p>}

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" disabled={Boolean(busy) || Boolean(createdPlan)} onClick={previewPlan} className="rounded border border-blue-500 px-4 py-2 font-semibold text-blue-300 disabled:opacity-50">{busy === 'preview' ? 'Preparing preview...' : 'Preview plan'}</button>
        <button type="button" disabled={Boolean(busy) || Boolean(createdPlan)} onClick={createPlan} className="rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-600 disabled:opacity-50">{busy === 'create' ? 'Creating...' : 'Create reminder plan'}</button>
      </div>
    </div>
  );
};

export default StandaloneReminderForm;
