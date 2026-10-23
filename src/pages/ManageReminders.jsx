import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import api from '../utils/axiosInstance';

export const channelLabel = (delivery, channel, due) => {
  const status = delivery?.status || 'not_selected';
  if (status === 'manual_sent') return 'Sent (confirmed by admin)';
  if (status === 'accepted') return 'Sent';
  if (status === 'pending') return channel === 'whatsapp' && due ? 'Message ready' : 'Scheduled';
  if (status === 'uncertain') return 'Needs review';
  if (status === 'skipped') return 'Missed';
  return status.replaceAll('_', ' ');
};

const formatTime = (value) => value ? new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : '-';

const ManageReminders = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(null);
  const [share, setShare] = useState(null);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/reminders/occurrences', { params: { page, limit: 20, status }, signal });
      setItems(data.occurrences);
      setPages(data.pagination.pages);
    } catch (err) {
      if (err.code !== 'ERR_CANCELED') setError(err.response?.data?.message || 'Could not load reminders');
    } finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load(controller.signal);
    }, 30_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load]);

  const action = async (id, operation) => {
    setBusy(id);
    try { await operation(); } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update reminder');
    } finally { setBusy(''); }
  };

  return <AdminLayout>
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold text-white">Reminders</h1>
      <div className="flex flex-wrap gap-3">
        <select aria-label="Reminder status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-gray-800 border border-gray-600 rounded px-3 py-2">
          <option value="">All statuses</option>
          {['pending', 'processing', 'sent', 'failed', 'partially_failed', 'missed', 'cancelled'].map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}
        </select>
        <button disabled={loading} onClick={() => load()} className="border border-gray-600 rounded px-4 py-2 disabled:opacity-50">Refresh</button>
      </div>
    </div>
    {error && <p role="alert" className="text-red-300 mb-4">{error}</p>}
    {loading && <p role="status" className="mb-4 text-gray-400">Loading reminders...</p>}
    {!loading && !error && items.length === 0 && <p className="text-gray-400 py-10">No reminders found.</p>}
    <div className="divide-y divide-gray-700">
      {items.map((item) => {
        const due = new Date(item.scheduledAt) <= new Date();
        const blocked = ['cancelled', 'missed'].includes(item.status) || (item.definition?.status && item.definition.status !== 'active');
        const whatsappPending = ['pending', 'failed'].includes(item.whatsappDelivery?.status);
        return <article key={item._id} className="py-5 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-5">
          <div className="min-w-0">
            <h2 className="font-semibold text-white break-words">{item.recipientSnapshot.name}</h2>
            <p className="text-sm text-gray-300 break-words mt-1">{item.contentSnapshot.subjectEnglish || 'Custom reminder'}</p>
            <p className="text-sm text-gray-400 mt-2">{formatTime(item.scheduledAt)} IST</p>
            <p className="text-xs text-gray-400 mt-1 capitalize">{item.status.replaceAll('_', ' ')}{item.definition?.status === 'paused' ? ' / Paused' : ''}</p>
            <button className="text-sm underline text-blue-300 mt-2" onClick={() => { setPreview(item); setShare(null); }}>View message</button>
          </div>
          <div className="min-w-0">
            <h3 className="font-medium">Email</h3>
            <p className="text-sm text-gray-400 break-all">{item.recipientSnapshot.email || '-'}</p>
            <p className={`text-sm mt-2 ${['accepted', 'delivered'].includes(item.emailDelivery.status) ? 'text-green-300' : 'text-amber-300'}`}>{channelLabel(item.emailDelivery, 'email', due)}</p>
            {item.emailDelivery.acceptedAt && <p className="text-xs text-gray-400 mt-1">{formatTime(item.emailDelivery.acceptedAt)} IST</p>}
            {item.emailDelivery.lastError && <p className="text-xs text-red-300 break-words mt-1">{item.emailDelivery.lastError}</p>}
            {item.emailDelivery.status === 'failed' && !blocked && <button disabled={busy === item._id || item.emailDelivery.attemptsCount >= item.maxAttemptsPerChannel || new Date(item.nextAttemptAt || 0) > new Date()} className="border border-gray-600 rounded px-3 py-2 mt-2 text-sm disabled:opacity-50" onClick={() => action(item._id, async () => {
              await api.post(`/api/reminders/occurrences/${item._id}/send-email`);
              toast.success('Email sent'); await load();
            })}>Retry email</button>}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium">WhatsApp</h3>
            <p className="text-sm text-gray-400 break-all">{item.recipientSnapshot.phone || '-'}</p>
            <p className={`text-sm mt-2 ${item.whatsappDelivery.status === 'manual_sent' ? 'text-green-300' : 'text-amber-300'}`}>{blocked && whatsappPending ? 'Unavailable' : channelLabel(item.whatsappDelivery, 'whatsapp', due)}</p>
            {item.whatsappDelivery.manuallySentAt && <p className="text-xs text-gray-400 mt-1">{formatTime(item.whatsappDelivery.manuallySentAt)} IST</p>}
            {due && !blocked && whatsappPending && <button disabled={busy === item._id} className="bg-green-700 hover:bg-green-600 rounded px-3 py-2 mt-2 text-sm disabled:opacity-50" onClick={() => action(item._id, async () => {
              const { data } = await api.get(`/api/reminders/occurrences/${item._id}/whatsapp`);
              setPreview(item); setShare(data);
            })}>Share on WhatsApp</button>}
          </div>
        </article>;
      })}
    </div>
    <div className="flex justify-between items-center gap-3 mt-6">
      <button disabled={page <= 1 || loading} className="border border-gray-600 rounded px-3 py-2 disabled:opacity-40" onClick={() => setPage(page - 1)}>Previous</button>
      <span className="text-sm">Page {page} of {Math.max(1, pages)}</span>
      <button disabled={page >= pages || loading} className="border border-gray-600 rounded px-3 py-2 disabled:opacity-40" onClick={() => setPage(page + 1)}>Next</button>
    </div>
    {preview && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="reminder-preview-title" className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg bg-gray-900 p-5 border border-gray-700" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') setPreview(null); }}>
        <div className="flex justify-between gap-4 mb-4"><h2 id="reminder-preview-title" className="text-lg font-semibold">{preview.recipientSnapshot.name}</h2><button autoFocus onClick={() => setPreview(null)} className="text-sm underline">Close</button></div>
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">{share?.message || `${preview.contentSnapshot.bodyEnglish}\n\n${preview.contentSnapshot.bodyHindi}`}</div>
        {share && <div className="flex flex-wrap gap-3 mt-6">
          <a href={share.url} target="_blank" rel="noopener noreferrer" className="bg-green-700 rounded px-4 py-2 text-sm">Open WhatsApp</a>
          <button disabled={busy === preview._id} className="border border-green-500 rounded px-4 py-2 text-sm disabled:opacity-50" onClick={() => {
            if (!window.confirm('Have you sent this message to the customer in WhatsApp?')) return;
            action(preview._id, async () => {
              await api.post(`/api/reminders/occurrences/${preview._id}/whatsapp-sent`, { confirmed: true });
              setPreview(null); toast.success('WhatsApp marked as sent'); await load();
            });
          }}>Mark as sent</button>
        </div>}
      </section>
    </div>}
  </AdminLayout>;
};

export default ManageReminders;
