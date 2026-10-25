import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/axiosInstance';
import { confirmAction } from '../utils/confirmationDialog';
import { channelLabel } from './ReminderWorkspace';

const formatTime = (value) => value ? new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : '-';

const humanize = (value) => String(value || '').replaceAll('_', ' ');

const eventLabel = (occurrence) => {
  if (occurrence.definitionType === 'rental_activation_confirmation') return 'Rental confirmation';
  if (occurrence.planRowKey === 'STARTING_MESSAGE') return 'Starting message';
  return 'Scheduled reminder';
};

const contextFrom = (detail, scope) => {
  const rental = detail.rentals?.[0];
  const plan = detail.plans?.[0];
  if (scope === 'rental') return {
    title: rental?.machineSnapshot?.name || 'Rental machine',
    code: rental?.rentalCode || plan?.planCode || 'Legacy rental reminders',
    status: rental?.status,
    period: rental?.handoverAt && rental?.expectedReturnAt
      ? `${formatTime(rental.handoverAt)} to ${formatTime(rental.expectedReturnAt)} IST` : '',
  };
  return {
    title: plan?.productContextSnapshot?.name || 'Custom customer message',
    code: plan?.planCode || 'Legacy custom reminders',
    status: plan?.status,
    period: plan?.startsAt && plan?.endsAt
      ? `${formatTime(plan.startsAt)} to ${formatTime(plan.endsAt)} IST` : '',
  };
};

const ReminderLogGroupDetail = ({ scope, mode, groupType, groupId }) => {
  const location = useLocation();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(null);
  const [share, setShare] = useState(null);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/reminders/log-groups/${groupType}/${groupId}`, {
        params: { scope }, signal,
      });
      setDetail(data);
    } catch (requestError) {
      if (requestError.code !== 'ERR_CANCELED') {
        setError(requestError.response?.data?.message || 'Could not load reminder history');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [groupId, groupType, scope]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  const definitions = useMemo(() => new Map(
    (detail?.definitions || []).map((definition) => [String(definition._id), definition])
  ), [detail]);
  const backPath = `/admin/reminder-logs/${mode}${location.search}`;

  const runAction = async (occurrenceId, operation) => {
    setBusy(occurrenceId);
    try {
      await operation();
    } catch (actionError) {
      toast.error(actionError.response?.data?.message || 'Could not update reminder');
    } finally {
      setBusy('');
    }
  };

  if (loading) return <div role="status" className="border-y border-gray-700 py-12 text-center text-gray-400">Loading complete reminder history...</div>;
  if (error) return <div role="alert" className="border-l-2 border-red-500 py-3 pl-4 text-red-300"><p>{error}</p><div className="mt-3 flex flex-wrap gap-4"><button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="text-sm underline">Try again</button><Link to={backPath} className="text-sm underline">Back to reminder logs</Link></div></div>;
  if (!detail) return null;

  const context = contextFrom(detail, scope);
  const recipient = detail.group?.recipientSnapshot || detail.occurrences?.[0]?.recipientSnapshot || {};

  return <>
    <div className="mb-6 flex flex-col gap-4 border-b border-gray-700 pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <Link to={backPath} className="text-sm font-semibold text-blue-300 underline">Back to reminder logs</Link>
        <h2 className="mt-4 break-words text-xl font-semibold text-white">{recipient.name || 'Unknown customer'}</h2>
        <p className="mt-1 break-all text-sm text-gray-400">{recipient.email || 'No email'} · {recipient.phone || 'No phone'}</p>
      </div>
      <button type="button" disabled={loading} onClick={() => setRefreshKey((value) => value + 1)} className="w-fit rounded border border-gray-600 px-4 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">Refresh</button>
    </div>

    <section aria-label="Reminder group context" className="grid grid-cols-1 gap-5 border-b border-gray-700 pb-6 sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs font-semibold uppercase text-gray-500">Context</p><p className="mt-1 break-words font-medium text-blue-200">{context.title}</p><p className="mt-1 text-xs text-gray-500">{context.code}</p></div>
      <div><p className="text-xs font-semibold uppercase text-gray-500">Created</p><p className="mt-1 text-sm text-gray-300">{formatTime(detail.group?.createdAt)} IST</p></div>
      <div><p className="text-xs font-semibold uppercase text-gray-500">Current status</p><p className="mt-1 text-sm capitalize text-gray-300">{humanize(context.status) || 'Historical record'}</p></div>
      <div><p className="text-xs font-semibold uppercase text-gray-500">Period</p><p className="mt-1 text-sm text-gray-300">{context.period || 'Not available'}</p></div>
    </section>

    <section className="pt-6" aria-labelledby="complete-history-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 id="complete-history-heading" className="text-lg font-semibold text-white">Complete history</h3><p className="mt-1 text-sm text-gray-400">{detail.occurrences?.length || 0} recorded message{detail.occurrences?.length === 1 ? '' : 's'}, oldest first.</p></div></div>
      <div className="divide-y divide-gray-700 border-y border-gray-700">
        {(detail.occurrences || []).map((occurrence, index) => {
          const definition = definitions.get(String(occurrence.definition));
          const due = new Date(occurrence.scheduledAt) <= new Date();
          const blocked = ['cancelled', 'missed'].includes(occurrence.status) || (definition?.status && definition.status !== 'active');
          const whatsappPending = ['pending', 'failed'].includes(occurrence.whatsappDelivery?.status);
          const retryBlocked = busy === occurrence._id
            || occurrence.emailDelivery?.attemptsCount >= occurrence.maxAttemptsPerChannel
            || new Date(occurrence.nextAttemptAt || 0) > new Date();
          return <article key={occurrence._id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 py-6 sm:gap-5">
            <div className="flex flex-col items-center" aria-hidden="true"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-600 bg-gray-900 text-xs text-gray-300">{index + 1}</span>{index < detail.occurrences.length - 1 && <span className="mt-2 h-full w-px bg-gray-700" />}</div>
            <div className="min-w-0">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-white">{eventLabel(occurrence)}</h4><span className="rounded bg-gray-800 px-2 py-0.5 text-xs capitalize text-gray-300">{humanize(occurrence.status)}</span><span className="text-xs text-gray-500">Version {occurrence.scheduleVersion}</span></div><p className="mt-1 text-sm text-gray-400">{formatTime(occurrence.scheduledAt)} IST</p></div>
                <button type="button" onClick={() => { setPreview(occurrence); setShare(null); }} className="w-fit text-sm font-semibold text-blue-300 underline">View message</button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase text-gray-500">Email</p><p className="mt-1 text-sm capitalize text-gray-300">{channelLabel(occurrence.emailDelivery, 'email', due)}</p>{occurrence.emailDelivery?.lastAttemptAt && <p className="mt-1 text-xs text-gray-500">Last attempt: {formatTime(occurrence.emailDelivery.lastAttemptAt)} IST</p>}{occurrence.emailDelivery?.lastError && <p className="mt-1 break-words text-xs text-red-300">{occurrence.emailDelivery.lastError}</p>}{occurrence.emailDelivery?.status === 'failed' && !blocked && <button type="button" disabled={retryBlocked} onClick={() => runAction(occurrence._id, async () => { await api.post(`/api/reminders/occurrences/${occurrence._id}/send-email`); toast.success('Email sent'); setRefreshKey((value) => value + 1); })} className="mt-2 rounded border border-gray-600 px-3 py-2 text-sm disabled:opacity-40">Retry email</button>}</div>
                <div><p className="text-xs font-semibold uppercase text-gray-500">WhatsApp</p><p className="mt-1 text-sm capitalize text-gray-300">{blocked && whatsappPending ? 'Unavailable' : channelLabel(occurrence.whatsappDelivery, 'whatsapp', due)}</p>{occurrence.whatsappDelivery?.manuallySentAt && <p className="mt-1 text-xs text-gray-500">Confirmed: {formatTime(occurrence.whatsappDelivery.manuallySentAt)} IST</p>}{due && !blocked && whatsappPending && <button type="button" disabled={busy === occurrence._id} onClick={() => runAction(occurrence._id, async () => { const { data } = await api.get(`/api/reminders/occurrences/${occurrence._id}/whatsapp`); setPreview(occurrence); setShare(data); })} className="mt-2 rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-40">Share on WhatsApp</button>}</div>
              </div>

              {occurrence.deliveryAttempts?.length > 0 && <details className="mt-4 border-l-2 border-gray-700 pl-3"><summary className="cursor-pointer text-sm text-gray-300">Delivery attempts ({occurrence.deliveryAttempts.length})</summary><div className="mt-2 divide-y divide-gray-800">{occurrence.deliveryAttempts.map((attempt) => <div key={attempt._id} className="py-2 text-xs text-gray-400"><span className="capitalize">{attempt.channel} attempt {attempt.attemptNumber}: {humanize(attempt.status)}</span><span className="ml-2">{formatTime(attempt.startedAt)} IST</span>{attempt.errorMessage && <p className="mt-1 break-words text-red-300">{attempt.errorMessage}</p>}</div>)}</div></details>}
              {occurrence.cancellationReason && <p className="mt-3 break-words text-xs text-gray-400">Cancellation: {occurrence.cancellationReason}</p>}
            </div>
          </article>;
        })}
      </div>
    </section>

    {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setPreview(null); setShare(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="group-message-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-5" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { if (event.key === 'Escape') { setPreview(null); setShare(null); } }}>
        <div className="mb-4 flex justify-between gap-4"><h2 id="group-message-title" className="text-lg font-semibold">{eventLabel(preview)}</h2><button type="button" autoFocus onClick={() => { setPreview(null); setShare(null); }} className="text-sm underline">Close</button></div>
        {share ? <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{share.message}</div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><div className="whitespace-pre-wrap break-words text-sm leading-relaxed"><strong className="mb-2 block text-white">English</strong>{preview.contentSnapshot?.bodyEnglish || 'No English message saved.'}</div><div className="whitespace-pre-wrap break-words text-sm leading-relaxed"><strong className="mb-2 block text-white">Hindi</strong>{preview.contentSnapshot?.bodyHindi || 'No Hindi message saved.'}</div></div>}
        {share && <div className="mt-6 flex flex-wrap gap-3"><a href={share.url} target="_blank" rel="noopener noreferrer" className="rounded bg-green-700 px-4 py-2 text-sm font-semibold">Open WhatsApp</a><button type="button" disabled={busy === preview._id} onClick={async () => { if (!await confirmAction('Have you sent this message to the customer in WhatsApp?')) return; runAction(preview._id, async () => { await api.post(`/api/reminders/occurrences/${preview._id}/whatsapp-sent`, { confirmed: true }); setPreview(null); setShare(null); toast.success('WhatsApp marked as sent'); setRefreshKey((value) => value + 1); }); }} className="rounded border border-green-500 px-4 py-2 text-sm font-semibold disabled:opacity-50">Mark as sent</button></div>}
      </section>
    </div>}
  </>;
};

export default ReminderLogGroupDetail;
