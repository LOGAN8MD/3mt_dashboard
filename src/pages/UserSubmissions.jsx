import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import axios from '../utils/axiosInstance';

const statusOptions = ['all', 'pending', 'approved', 'rejected'];

const getImageUrl = (request) => request?.images?.[0]?.url || '';

const getFormattedDate = (dateValue) =>
  dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A';

const getStatusStyles = (status) => {
  const styles = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    approved: 'border-green-500/30 bg-green-500/10 text-green-300',
    rejected: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return styles[status] || 'border-blue-500/30 bg-blue-500/10 text-blue-300';
};

const UserSubmissions = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const response = await axios.get(`/api/pending-products/mine${query}`);
      setRequests(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load your submissions';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const stats = useMemo(
    () =>
      requests.reduce(
        (currentStats, request) => ({
          total: currentStats.total + 1,
          pending: request.status === 'pending' ? currentStats.pending + 1 : currentStats.pending,
          approved: request.status === 'approved' ? currentStats.approved + 1 : currentStats.approved,
          rejected: request.status === 'rejected' ? currentStats.rejected + 1 : currentStats.rejected,
        }),
        { total: 0, pending: 0, approved: 0, rejected: 0 }
      ),
    [requests]
  );

  const closeModal = () => {
    setSelectedRequest(null);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">My Requests</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Submissions</h1>
            <p className="mt-2 text-sm text-gray-400">Track products you submitted for admin approval.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-700 bg-[#0e1726] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              aria-label="Filter submissions by status"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchRequests}
              disabled={loading}
              className="rounded-lg border border-gray-700 bg-[#0e1726] px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[
            { label: 'Visible', value: stats.total, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
            { label: 'Pending', value: stats.pending, color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
            { label: 'Approved', value: stats.approved, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
            { label: 'Rejected', value: stats.rejected, color: 'border-red-500/40 bg-red-500/10 text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-800 bg-[#0e1726] p-5 shadow-lg">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${stat.color}`}>
                <span className="text-sm font-black">{stat.label.charAt(0)}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0e1726] shadow-lg">
          <div className="border-b border-gray-800 px-6 py-5">
            <h2 className="text-xl font-bold text-white">Submitted Products</h2>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-lg bg-[#1b2128]" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-red-400">{errorMessage}</p>
              <button
                type="button"
                onClick={fetchRequests}
                className="mt-4 rounded-lg border border-red-500/40 px-5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-gray-400">No product submissions found.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[820px] text-left">
                  <thead className="bg-[#111b2b] text-xs uppercase tracking-widest text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Submitted</th>
                      <th className="px-6 py-4">Reviewed</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {requests.map((request) => (
                      <tr key={request._id} className="transition hover:bg-[#162033]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {getImageUrl(request) ? (
                              <img src={getImageUrl(request)} alt={request.name} className="h-14 w-14 rounded-lg border border-gray-700 object-cover" />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-500">No IMG</div>
                            )}
                            <div>
                              <p className="font-bold text-white">{request.name}</p>
                              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">{request.brand || 'No Brand'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-200">₹{request.price}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusStyles(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{getFormattedDate(request.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{getFormattedDate(request.reviewedAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(request)}
                            className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-800 md:hidden">
                {requests.map((request) => (
                  <div key={request._id} className="p-5">
                    <div className="flex gap-4">
                      {getImageUrl(request) ? (
                        <img src={getImageUrl(request)} alt={request.name} className="h-20 w-20 shrink-0 rounded-lg border border-gray-700 object-cover" />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-gray-500">No IMG</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-bold text-white">{request.name}</p>
                        <p className="mt-1 text-sm font-bold text-gray-200">₹{request.price}</p>
                        <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusStyles(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="mt-4 w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={closeModal}>
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0e1726] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#1b2128] px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedRequest.name}</h2>
                <p className="mt-1 text-sm text-gray-400">Submitted {getFormattedDate(selectedRequest.createdAt)}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-3xl font-bold text-gray-400 transition hover:text-white">&times;</button>
            </div>

            <div className="overflow-y-auto p-6">
              <div className="mb-6 flex flex-wrap gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusStyles(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
                {selectedRequest.reviewedAt && (
                  <span className="rounded-full border border-gray-700 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                    Reviewed {getFormattedDate(selectedRequest.reviewedAt)}
                  </span>
                )}
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(selectedRequest.images || []).map((image) => (
                  <img
                    key={image.public_id || image.url}
                    src={image.url}
                    alt={selectedRequest.name}
                    className="h-28 w-full rounded-lg border border-gray-700 object-cover"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {[
                  ['Type', selectedRequest.type],
                  ['Category', selectedRequest.category],
                  ['Sub Category', selectedRequest.subCategory],
                  ['Brand', selectedRequest.brand],
                  ['Model', selectedRequest.model],
                  ['Size', selectedRequest.size],
                  ['Price', selectedRequest.price ? `₹${selectedRequest.price}` : '-'],
                  ['Stock', selectedRequest.stock ?? '-'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-gray-800 bg-[#1b2128] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-200">{value || '-'}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-5">
                <div className="rounded-xl border border-gray-800 bg-[#1b2128] p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                    {selectedRequest.description || 'No description provided.'}
                  </p>
                </div>

                {selectedRequest.adminNote && (
                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Admin Note</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-blue-100">{selectedRequest.adminNote}</p>
                  </div>
                )}

                {selectedRequest.rejectionReason && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-300">Rejection Reason</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-red-100">{selectedRequest.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserSubmissions;
