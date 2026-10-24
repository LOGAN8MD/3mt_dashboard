import { confirmAction, requestReason } from '../utils/confirmationDialog';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { toLocalDateTimeInput } from '../utils/rentalForm';
import {
  MANAGEABLE_REMINDER_STATUSES,
  buildPlanUpdatePayload,
  editablePlanOccurrences,
  planContextLabel,
  planEditForm,
} from '../utils/reminderPlanManagement';
import ReminderRowsEditor from './ReminderRowsEditor';

const fieldClass = 'rounded border border-gray-600 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none';
const formatTime = (value) => value ? new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : '-';
const deliveryLabel = (delivery) => (delivery?.status || 'not_selected').replaceAll('_', ' ');

const ReminderPlanManagement = ({ fixedPlanType = '', rentalId = '', embedded = false }) => {
  const [plans, setPlans] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [search, setSearch] = useState('');
  const [planType, setPlanType] = useState(fixedPlanType);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [detail, setDetail] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [messageId, setMessageId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 15, search, planType: fixedPlanType || planType, status };
      if (rentalId) params.rental = rentalId;
      const { data } = await api.get('/api/reminders/plans', {
        params,
      });
      setPlans(data.plans || []);
      setPages(data.pagination?.pages || 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load reminder plans');
    } finally {
      setLoading(false);
    }
  }, [fixedPlanType, page, planType, rentalId, search, status]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!detail) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setDetail(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [detail]);

  const openPlan = async (id) => {
    setBusy(id);
    setError('');
    try {
      const { data } = await api.get(`/api/reminders/plans/${id}`);
      setDetail(data);
      setEditForm(null);
      setMessageId('');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not load reminder plan');
    } finally {
      setBusy('');
    }
  };

  const refreshDetail = async () => {
    if (!detail?._id) return;
    const { data } = await api.get(`/api/reminders/plans/${detail._id}`);
    setDetail(data);
  };

  const planAction = async (action, body) => {
    setBusy(action);
    try {
      await api.post(`/api/reminders/plans/${detail._id}/${action}`, body);
      toast.success(action === 'cancel' ? 'Reminder plan cancelled' : `Reminder plan ${action}d`);
      await Promise.all([load(), refreshDetail()]);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || `Could not ${action} reminder plan`);
    } finally {
      setBusy('');
    }
  };

  const cancelPlan = async () => {
    const reason = await requestReason('Why are you cancelling this reminder plan?');
    if (!reason?.trim()) return;
    planAction('cancel', { reason: reason.trim() });
  };

  const cancelOccurrence = async (occurrence) => {
    const reason = await requestReason('Why are you cancelling this reminder?');
    if (!reason?.trim()) return;
    setBusy(occurrence._id);
    try {
      await api.post(`/api/reminders/occurrences/${occurrence._id}/cancel`, { reason: reason.trim() });
      toast.success('Reminder occurrence cancelled');
      await Promise.all([load(), refreshDetail()]);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not cancel reminder occurrence');
    } finally {
      setBusy('');
    }
  };

  const beginEdit = () => {
    const form = planEditForm(detail);
    if (!form.reminders.length) {
      toast.error('This plan has no future unsent reminders to edit');
      return;
    }
    setEditForm(form);
  };

  const saveEdit = async () => {
    let payload;
    try {
      payload = buildPlanUpdatePayload(detail, editForm);
    } catch (validationError) {
      toast.error(validationError.message);
      return;
    }
    if (!await confirmAction('Replace the future unsent reminders with this schedule? Sent history will be preserved.')) return;
    setBusy('edit');
    try {
      await api.patch(`/api/reminders/plans/${detail._id}`, payload);
      toast.success('Future reminders updated');
      setEditForm(null);
      await Promise.all([load(), refreshDetail()]);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Could not update reminder plan');
    } finally {
      setBusy('');
    }
  };

  return <>
    <div className={`mb-5 grid grid-cols-1 gap-3 ${embedded ? 'sm:grid-cols-[12rem_auto]' : fixedPlanType ? 'lg:grid-cols-[minmax(16rem,1fr)_12rem_auto]' : 'lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto]'}`}>
      {!embedded && <input aria-label="Search reminder plans" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search plan, customer, product, email, or phone" className={fieldClass} />}
      {!fixedPlanType && <select aria-label="Plan type" value={planType} onChange={(event) => { setPlanType(event.target.value); setPage(1); }} className={fieldClass}><option value="">All plan types</option><option value="rental">Rental</option><option value="standalone">Custom</option></select>}
      <select aria-label="Plan status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={fieldClass}><option value="">All statuses</option>{['active', 'paused', 'completed', 'cancelled'].map((value) => <option key={value} value={value}>{value}</option>)}</select>
      <button disabled={loading} onClick={load} className="rounded border border-gray-600 px-4 py-2 disabled:opacity-50">Refresh</button>
    </div>

    {error && <p role="alert" className="mb-4 border-l-4 border-red-500 bg-red-950/30 p-3 text-red-200">{error}</p>}
    {loading && <p role="status" className="py-8 text-gray-400">Loading reminder plans...</p>}
    {!loading && !error && plans.length === 0 && <p role="status" className="py-10 text-gray-400">No reminder plans found.</p>}

    <div className="divide-y divide-gray-700">
      {plans.map((plan) => <article key={plan._id} className="grid grid-cols-1 gap-4 py-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0"><h2 className="break-words font-semibold text-white">{plan.recipientSnapshot.name}</h2><p className="mt-1 break-all text-sm text-gray-400">{plan.planCode}</p><span className="mt-2 inline-block text-xs font-semibold uppercase text-blue-300">{plan.planType === 'rental' ? 'Rental' : 'Custom'}</span></div>
        <div className="min-w-0"><p className="break-words text-sm text-gray-200">{planContextLabel(plan)}</p><p className="mt-1 break-all text-xs text-gray-500">{plan.recipientSnapshot.email || plan.recipientSnapshot.phone || 'No contact'}</p></div>
        <div><p className="text-sm text-gray-300">{formatTime(plan.startsAt)} - {formatTime(plan.endsAt)} IST</p><p className="mt-1 text-xs text-gray-500">{plan.rows?.length || 0} reminder{plan.rows?.length === 1 ? '' : 's'} · Version {plan.version}</p></div>
        <div className="flex items-center gap-3 lg:justify-end"><span className={`text-xs font-semibold uppercase ${plan.status === 'active' ? 'text-green-300' : plan.status === 'paused' ? 'text-amber-300' : 'text-gray-400'}`}>{plan.status}</span><button disabled={busy === plan._id} onClick={() => openPlan(plan._id)} className="rounded border border-blue-500/60 px-3 py-2 text-sm text-blue-300 disabled:opacity-50">Details</button></div>
      </article>)}
    </div>

    <div className="mt-6 flex items-center justify-between gap-3"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded border border-gray-600 px-3 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {page} of {Math.max(1, pages)}</span><button disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded border border-gray-600 px-3 py-2 disabled:opacity-40">Next</button></div>

    {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5" onClick={() => setDetail(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="plan-detail-title" className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-4 sm:p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-700 pb-5"><div><p className="text-xs font-semibold uppercase text-blue-300">{detail.planType === 'rental' ? 'Rental plan' : 'Custom plan'} · {detail.status}</p><h2 id="plan-detail-title" className="mt-1 text-xl font-semibold text-white">{detail.recipientSnapshot.name}</h2><p className="mt-1 text-sm text-gray-400">{detail.planCode} · {planContextLabel(detail)}</p></div><button autoFocus onClick={() => setDetail(null)} className="rounded border border-gray-600 px-3 py-2 text-sm">Close</button></div>

        <div className="grid grid-cols-1 gap-4 border-b border-gray-700 py-5 sm:grid-cols-2 lg:grid-cols-4"><div><span className="text-xs uppercase text-gray-500">Email</span><p className="break-all text-sm">{detail.recipientSnapshot.email || '-'}</p></div><div><span className="text-xs uppercase text-gray-500">WhatsApp</span><p className="break-all text-sm">{detail.recipientSnapshot.phone || '-'}</p></div><div><span className="text-xs uppercase text-gray-500">Period</span><p className="text-sm">{formatTime(detail.startsAt)}<br />to {formatTime(detail.endsAt)} IST</p></div><div><span className="text-xs uppercase text-gray-500">Version</span><p className="text-sm">{detail.version} · {detail.rows?.length || 0} current rows</p></div></div>

        {['active', 'paused'].includes(detail.status) && <div className="flex flex-wrap gap-3 border-b border-gray-700 py-5"><button disabled={Boolean(busy)} onClick={() => planAction(detail.status === 'active' ? 'pause' : 'resume')} className="rounded border border-amber-500/70 px-3 py-2 text-sm text-amber-300">{detail.status === 'active' ? 'Pause plan' : 'Resume plan'}</button><button disabled={Boolean(busy) || !editablePlanOccurrences(detail).length} onClick={beginEdit} className="rounded border border-blue-500/70 px-3 py-2 text-sm text-blue-300 disabled:opacity-40">Edit future reminders</button><button disabled={Boolean(busy)} onClick={cancelPlan} className="rounded border border-red-500/70 px-3 py-2 text-sm text-red-300">Cancel plan</button></div>}

        {editForm && <section className="border-b border-gray-700 py-6" aria-labelledby="edit-plan-heading"><div className="mb-5 flex items-center justify-between gap-3"><div><h3 id="edit-plan-heading" className="font-semibold text-white">Edit future reminders</h3><p className="mt-1 text-sm text-gray-400">Sent and partially delivered history remains unchanged.</p></div><button onClick={() => setEditForm(null)} className="text-sm underline">Close editor</button></div>{detail.planType === 'standalone' && <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-xs uppercase text-gray-500">Start (IST)</label><input type="datetime-local" value={editForm.startAt} onChange={(event) => setEditForm((current) => ({ ...current, startAt: event.target.value }))} className={`${fieldClass} w-full`} /></div><div><label className="mb-1 block text-xs uppercase text-gray-500">End (IST)</label><input type="datetime-local" value={editForm.endAt} onChange={(event) => setEditForm((current) => ({ ...current, endAt: event.target.value }))} className={`${fieldClass} w-full`} /></div></div>}<ReminderRowsEditor reminders={editForm.reminders} onChange={(reminders) => setEditForm((current) => ({ ...current, reminders }))} endAt={detail.planType === 'rental' ? toLocalDateTimeInput(detail.rental.expectedReturnAt) : editForm.endAt} /><button disabled={busy === 'edit'} onClick={saveEdit} className="mt-5 rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy === 'edit' ? 'Saving...' : 'Save future reminders'}</button></section>}

        <section className="py-5" aria-labelledby="plan-occurrences-heading"><h3 id="plan-occurrences-heading" className="font-semibold text-white">Reminder history</h3><div className="mt-3 divide-y divide-gray-700">{(detail.occurrences || []).map((occurrence, index) => <article key={occurrence._id} className="py-5"><div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"><div><strong className="text-sm text-white">Reminder {index + 1}</strong><p className="mt-1 text-sm text-gray-300">{formatTime(occurrence.scheduledAt)} IST</p><p className="mt-1 text-xs uppercase text-gray-500">{occurrence.status} · Version {occurrence.scheduleVersion}</p><button onClick={() => setMessageId(messageId === occurrence._id ? '' : occurrence._id)} className="mt-2 text-sm text-blue-300 underline">{messageId === occurrence._id ? 'Hide message' : 'View message'}</button></div><div><span className="text-xs uppercase text-gray-500">Email</span><p className="mt-1 text-sm capitalize">{deliveryLabel(occurrence.emailDelivery)}</p>{occurrence.emailDelivery?.lastError && <p className="mt-1 break-words text-xs text-red-300">{occurrence.emailDelivery.lastError}</p>}</div><div><span className="text-xs uppercase text-gray-500">WhatsApp</span><p className="mt-1 text-sm capitalize">{deliveryLabel(occurrence.whatsappDelivery)}</p>{occurrence.whatsappDelivery?.lastError && <p className="mt-1 break-words text-xs text-red-300">{occurrence.whatsappDelivery.lastError}</p>}</div><div>{MANAGEABLE_REMINDER_STATUSES.includes(occurrence.status) && <button disabled={busy === occurrence._id} onClick={() => cancelOccurrence(occurrence)} className="rounded border border-red-500/60 px-3 py-2 text-sm text-red-300 disabled:opacity-40">Cancel reminder</button>}</div></div>{messageId === occurrence._id && <div className="mt-4 grid grid-cols-1 gap-4 border-l-2 border-gray-700 pl-4 lg:grid-cols-2"><div className="whitespace-pre-wrap break-words text-sm text-gray-300"><strong className="mb-2 block text-white">English</strong>{occurrence.contentSnapshot?.bodyEnglish}</div><div className="whitespace-pre-wrap break-words text-sm text-gray-300"><strong className="mb-2 block text-white">Hindi</strong>{occurrence.contentSnapshot?.bodyHindi}</div></div>}</article>)}</div></section>
      </section>
    </div>}
  </>;
};

export default ReminderPlanManagement;
