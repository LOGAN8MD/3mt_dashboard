import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import api from '../utils/axiosInstance';

const PAGE_SIZE = 12;

const formatTime = (value) => value ? new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value)) : 'Not scheduled';

const contextFor = (group, scope) => {
  const context = group.context || {};
  if (scope === 'rental') {
    return {
      title: context.machine?.name || 'Rental machine',
      detail: context.rentalCode || context.planCode || 'Legacy rental reminders',
    };
  }
  return {
    title: context.product?.name || 'Custom customer message',
    detail: context.planCode || 'Legacy custom reminders',
  };
};

const GroupedReminderLogs = ({ scope, mode }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const sortBy = ['createdAt', 'scheduledAt'].includes(searchParams.get('sortBy'))
    ? searchParams.get('sortBy') : 'createdAt';
  const sortDirection = ['asc', 'desc'].includes(searchParams.get('direction'))
    ? searchParams.get('direction') : 'desc';
  const search = searchParams.get('search') || '';

  const updateQuery = useCallback((changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value && value !== '1') next.set(key, String(value));
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = searchInput.trim();
      if (normalized !== search) updateQuery({ search: normalized, page: '' });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, searchInput, updateQuery]);

  useEffect(() => {
    setSearchInput(search);
  }, [scope, search]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/reminders/log-groups', {
          params: { scope, search, sortBy, sortDirection, page, limit: PAGE_SIZE },
          signal: controller.signal,
        });
        setGroups(data.groups || []);
        setPagination(data.pagination || { page, pages: 0, total: 0 });
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(requestError.response?.data?.message || 'Could not load reminder logs');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [page, refreshKey, scope, search, sortBy, sortDirection]);

  return <>
    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">Reminder history</h2>
        <p className="mt-1 text-sm text-gray-400">One entry represents one {scope === 'rental' ? 'rental booking' : 'custom reminder plan'}.</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto xl:grid-cols-[minmax(260px,1fr)_auto_auto_auto]">
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Search customer</span>
          <input aria-label="Search reminder customers" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Name, email, or phone" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder:text-gray-500" />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Sort by</span>
          <select aria-label="Sort reminder logs" value={sortBy} onChange={(event) => updateQuery({ sortBy: event.target.value, page: '' })} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white">
            <option value="createdAt">Created time</option>
            <option value="scheduledAt">Scheduled time</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">Direction</span>
          <select aria-label="Sort direction" value={sortDirection} onChange={(event) => updateQuery({ direction: event.target.value, page: '' })} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white">
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
        <button type="button" disabled={loading} onClick={() => setRefreshKey((value) => value + 1)} className="self-end rounded border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 disabled:opacity-50">Refresh</button>
      </div>
    </div>

    <div className="mb-3 flex min-h-6 items-center justify-between gap-3 text-sm text-gray-400">
      <span>{pagination.total || 0} {pagination.total === 1 ? 'entry' : 'entries'}</span>
      {search && <button type="button" onClick={() => { setSearchInput(''); updateQuery({ search: '', page: '' }); }} className="text-blue-300 underline">Clear search</button>}
    </div>
    {error && <div role="alert" className="border-l-2 border-red-500 py-3 pl-4 text-red-300"><p>{error}</p><button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="mt-2 text-sm underline">Try again</button></div>}
    {loading && <div role="status" className="border-y border-gray-700 py-10 text-center text-gray-400">Loading reminder groups...</div>}
    {!loading && !error && groups.length === 0 && <div className="border-y border-gray-700 py-12 text-center"><p className="font-medium text-gray-300">No reminder groups found</p><p className="mt-1 text-sm text-gray-500">{search ? 'Try another customer name, email, or phone.' : 'Created reminder plans will appear here.'}</p></div>}

    {!error && <div className={loading ? 'hidden' : 'divide-y divide-gray-700 border-y border-gray-700'}>
      {groups.map((group) => {
        const context = contextFor(group, scope);
        return <article key={group.groupKey} className="bg-gray-900/20 hover:bg-gray-800/35">
          <Link to={`/admin/reminder-logs/${mode}/${group.groupType}/${group.groupId}${location.search}`} className="grid w-full grid-cols-1 gap-4 px-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(180px,.8fr)_auto] lg:items-center lg:px-5">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <strong className="truncate text-white">{group.recipientSnapshot?.name || 'Unknown customer'}</strong>
                <span className="shrink-0 rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-200">{group.occurrenceCount || 0}</span>
              </div>
              <p className="mt-1 truncate text-sm text-gray-400">{group.recipientSnapshot?.email || group.recipientSnapshot?.phone || 'No contact saved'}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-blue-200">{context.title}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{context.detail}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">{sortBy === 'scheduledAt' ? 'Schedule anchor' : 'Created'}</p>
              <p className="mt-1 text-sm text-gray-300">{formatTime(sortBy === 'scheduledAt' ? group.scheduledAt : group.createdAt)} IST</p>
            </div>
            <div className="lg:text-right">
              <p className="text-sm font-semibold text-blue-300">Open history</p>
              <p className="mt-1 text-xs text-gray-500">{group.statusSummary?.sent || 0} sent · {(group.statusSummary?.failed || 0) + (group.statusSummary?.partiallyFailed || 0)} issues</p>
            </div>
          </Link>
        </article>;
      })}
    </div>}

    <div className="mt-6 flex items-center justify-between gap-3">
      <button type="button" disabled={page <= 1 || loading} onClick={() => updateQuery({ page: page - 1 })} className="rounded border border-gray-600 px-3 py-2 text-sm disabled:opacity-40">Previous</button>
      <span className="text-sm text-gray-300">Page {page} of {Math.max(1, pagination.pages || 0)}</span>
      <button type="button" disabled={page >= (pagination.pages || 0) || loading} onClick={() => updateQuery({ page: page + 1 })} className="rounded border border-gray-600 px-3 py-2 text-sm disabled:opacity-40">Next</button>
    </div>
  </>;
};

export default GroupedReminderLogs;
