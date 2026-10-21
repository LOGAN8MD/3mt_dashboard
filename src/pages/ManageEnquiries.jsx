import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import EnquiryOfferDetails from '../components/EnquiryOfferDetails';
import axios from '../utils/axiosInstance';

const statusOptions = ['', 'new', 'contacted', 'converted', 'closed', 'spam'];
const sourceOptions = ['', 'product_detail', 'cart', 'contact'];
const limitOptions = ['25', '50', '100', '200'];
const AUTO_REFRESH_INTERVAL_MS = 300000;

const initialFilters = {
  search: '',
  status: '',
  source: '',
  dateFrom: '',
  dateTo: '',
  limit: '100',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatLabel = (value) => {
  if (!value) return 'All';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getCustomerName = (enquiry) =>
  enquiry.customerSnapshot?.name || enquiry.customer?.name || 'Unknown Customer';

const getCustomerEmail = (enquiry) =>
  enquiry.customerSnapshot?.email || enquiry.customer?.email || 'N/A';

const getCustomerPhone = (enquiry) =>
  enquiry.customerSnapshot?.phone || enquiry.customer?.phone || 'Not added';

const getCustomerAddress = (enquiry) =>
  enquiry.customerSnapshot?.address || enquiry.customer?.address || 'Not added';

const getAuthProvider = (enquiry) =>
  enquiry.customerSnapshot?.authProvider || enquiry.customer?.authProvider || 'N/A';

const getStatusClass = (status) => {
  const classes = {
    new: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    contacted: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    converted: 'border-green-500/30 bg-green-500/10 text-green-300',
    closed: 'border-gray-500/30 bg-gray-500/10 text-gray-300',
    spam: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return classes[status] || 'border-gray-500/30 bg-gray-500/10 text-gray-300';
};

const ManageEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  const [detailForm, setDetailForm] = useState({ status: 'new', notes: '' });
  const [filters, setFilters] = useState(initialFilters);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [isDeletingEnquiry, setIsDeletingEnquiry] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchEnquiries = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setErrorMessage('');

    const params = new URLSearchParams({ limit: filters.limit });
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.status) params.set('status', filters.status);
    if (filters.source) params.set('source', filters.source);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);

    try {
      const response = await axios.get(`/api/enquiries?${params.toString()}`);
      setEnquiries(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load enquiries';
      if (!silent) {
        setErrorMessage(message);
        toast.error(message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEnquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.source, filters.dateFrom, filters.dateTo, filters.limit]);

  const shouldPauseAutoRefresh = Boolean(
    selectedEnquiry ||
      enquiryToDelete ||
      detailLoading ||
      savingStatus ||
      savingNotes ||
      isDeletingEnquiry
  );

  useEffect(() => {
    if (!autoRefreshEnabled || shouldPauseAutoRefresh) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchEnquiries({ silent: true });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoRefreshEnabled,
    shouldPauseAutoRefresh,
    filters.search,
    filters.status,
    filters.source,
    filters.dateFrom,
    filters.dateTo,
    filters.limit,
  ]);

  const stats = useMemo(
    () =>
      enquiries.reduce(
        (summary, enquiry) => ({
          total: summary.total + 1,
          newCount: enquiry.status === 'new' ? summary.newCount + 1 : summary.newCount,
          converted: enquiry.status === 'converted' ? summary.converted + 1 : summary.converted,
          estimatedValue: summary.estimatedValue + Number(enquiry.totalEstimatedPrice || 0),
        }),
        { total: 0, newCount: 0, converted: 0, estimatedValue: 0 }
      ),
    [enquiries]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const updateEnquiryState = (updatedEnquiry) => {
    setSelectedEnquiry(updatedEnquiry);
    setDetailForm({
      status: updatedEnquiry.status || 'new',
      notes: updatedEnquiry.notes || '',
    });
    setEnquiries((currentEnquiries) =>
      currentEnquiries.map((enquiry) =>
        enquiry._id === updatedEnquiry._id ? { ...enquiry, ...updatedEnquiry } : enquiry
      )
    );
  };

  const openEnquiryDetail = async (enquiry) => {
    setSelectedEnquiry(enquiry);
    setDetailForm({ status: enquiry.status || 'new', notes: enquiry.notes || '' });
    setDetailLoading(true);
    setDetailError('');

    try {
      const response = await axios.get(`/api/enquiries/${enquiry._id}`);
      updateEnquiryState(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load enquiry details';
      setDetailError(message);
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeEnquiryDetail = () => {
    setSelectedEnquiry(null);
    setDetailForm({ status: 'new', notes: '' });
    setDetailLoading(false);
    setDetailError('');
  };

  const handleDetailFormChange = (event) => {
    const { name, value } = event.target;
    setDetailForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleStatusSave = async () => {
    if (!selectedEnquiry || detailForm.status === selectedEnquiry.status) return;

    setSavingStatus(true);

    try {
      const response = await axios.patch(`/api/enquiries/${selectedEnquiry._id}/status`, {
        status: detailForm.status,
      });
      updateEnquiryState(response.data);
      toast.success('Enquiry status updated successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update enquiry status';
      toast.error(message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleNotesSave = async () => {
    if (!selectedEnquiry || detailForm.notes === (selectedEnquiry.notes || '')) return;

    setSavingNotes(true);

    try {
      const response = await axios.patch(`/api/enquiries/${selectedEnquiry._id}/notes`, {
        notes: detailForm.notes,
      });
      updateEnquiryState(response.data);
      toast.success('Enquiry notes updated successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update enquiry notes';
      toast.error(message);
    } finally {
      setSavingNotes(false);
    }
  };

  const openDeleteModal = (enquiry) => {
    setEnquiryToDelete(enquiry);
  };

  const closeDeleteModal = () => {
    setEnquiryToDelete(null);
    setIsDeletingEnquiry(false);
  };

  const handleDeleteEnquiry = async () => {
    if (!enquiryToDelete) return;

    setIsDeletingEnquiry(true);

    try {
      await axios.delete(`/api/enquiries/${enquiryToDelete._id}`);
      setEnquiries((currentEnquiries) =>
        currentEnquiries.filter((enquiry) => enquiry._id !== enquiryToDelete._id)
      );

      if (selectedEnquiry?._id === enquiryToDelete._id) {
        closeEnquiryDetail();
      }

      toast.success('Enquiry deleted successfully');
      closeDeleteModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete enquiry';
      toast.error(message);
    } finally {
      setIsDeletingEnquiry(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Customer Requests</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Enquiries</h1>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label className="group flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-gray-700 bg-[#0e1726] px-4 py-3 transition hover:border-blue-500 sm:justify-start">
              <div>
                <span className="block text-sm font-bold uppercase tracking-wide text-gray-300 group-hover:text-white">
                  Auto Refresh
                </span>
                <span className="mt-1 block text-xs font-semibold text-gray-500">
                  Every 5 min
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(event) => setAutoRefreshEnabled(event.target.checked)}
                className="peer sr-only"
              />
              <span
                className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
                  autoRefreshEnabled
                    ? 'border-blue-400 bg-blue-600'
                    : 'border-gray-600 bg-[#1b2128]'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 h-5 w-5 rounded-full shadow transition ${
                    autoRefreshEnabled ? 'translate-x-5 bg-white' : 'translate-x-0 bg-gray-400'
                  }`}
                />
              </span>
            </label>
            <button
              type="button"
              onClick={() => fetchEnquiries()}
              disabled={loading}
              className="w-full rounded-lg border border-gray-700 bg-[#0e1726] px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Enquiries', value: stats.total, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
            { label: 'New', value: stats.newCount, color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
            { label: 'Converted', value: stats.converted, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
            { label: 'Estimated Purchase Value', value: formatCurrency(stats.estimatedValue), color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-800 bg-[#0e1726] p-5 shadow-lg">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${stat.color}`}>
                <span className="text-sm font-black">{stat.label.charAt(0)}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
              <p className="mt-2 break-words text-3xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="mb-6 rounded-xl border border-gray-800 bg-[#0e1726] p-5 shadow-lg">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_120px_auto] xl:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Search</span>
              <input
                type="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Customer, product, brand"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Status</span>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map((status) => (
                  <option key={status || 'all'} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Source</span>
              <select
                name="source"
                value={filters.source}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {sourceOptions.map((source) => (
                  <option key={source || 'all'} value={source}>
                    {formatLabel(source)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">From</span>
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">To</span>
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Limit</span>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {limitOptions.map((limit) => (
                  <option key={limit} value={limit}>
                    {limit}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={clearFilters}
              disabled={JSON.stringify(filters) === JSON.stringify(initialFilters)}
              className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition hover:border-gray-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0e1726] shadow-lg">
          <div className="border-b border-gray-800 px-6 py-5">
            <h2 className="text-xl font-bold text-white">Enquiry List</h2>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-lg bg-[#1b2128]" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-red-400">{errorMessage}</p>
              <button
                type="button"
                onClick={fetchEnquiries}
                className="mt-4 rounded-lg border border-red-500/40 px-5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-gray-400">No enquiries found.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="bg-[#111b2b] text-xs uppercase tracking-widest text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Products</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {enquiries.map((enquiry) => (
                      <tr key={enquiry._id} className="transition hover:bg-[#162033]">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white">{getCustomerName(enquiry)}</p>
                          <p className="mt-1 text-xs text-gray-400">{getCustomerEmail(enquiry)}</p>
                          <p className="mt-1 text-xs text-gray-500">{getCustomerPhone(enquiry)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {(enquiry.products || []).slice(0, 2).map((product) => (
                            <p key={`${enquiry._id}-${product.product}`} className="font-medium">
                              {product.nameSnapshot} x {product.quantity}
                            </p>
                          ))}
                          {(enquiry.products || []).length > 2 && (
                            <p className="mt-1 text-xs text-gray-500">
                              +{enquiry.products.length - 2} more
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-300">{formatLabel(enquiry.source)}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusClass(enquiry.status)}`}>
                            {formatLabel(enquiry.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-white">{formatCurrency(enquiry.totalEstimatedPrice)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatDate(enquiry.createdAt)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEnquiryDetail(enquiry)}
                              className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(enquiry)}
                              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-800 lg:hidden">
                {enquiries.map((enquiry) => (
                  <div key={enquiry._id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{getCustomerName(enquiry)}</p>
                        <p className="mt-1 text-sm text-gray-400">{getCustomerEmail(enquiry)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusClass(enquiry.status)}`}>
                        {formatLabel(enquiry.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-300">
                      {(enquiry.products || []).map((product) => `${product.nameSnapshot} x ${product.quantity}`).join(', ')}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-white">{formatCurrency(enquiry.totalEstimatedPrice)}</p>
                      <p className="text-xs uppercase tracking-widest text-gray-500">{formatDate(enquiry.createdAt)}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => openEnquiryDetail(enquiry)}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(enquiry)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0e1726] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Enquiry Detail</p>
                <h2 className="mt-1 text-2xl font-black text-white">{getCustomerName(selectedEnquiry)}</h2>
              </div>
              <button
                type="button"
                onClick={closeEnquiryDetail}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-300 transition hover:border-gray-500 hover:text-white"
              >
                Close
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-lg bg-[#1b2128]" />
                ))}
              </div>
            ) : detailError ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-red-400">{detailError}</p>
                <button
                  type="button"
                  onClick={() => openEnquiryDetail(selectedEnquiry)}
                  className="mt-4 rounded-lg border border-red-500/40 px-5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-6 p-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Customer Profile</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      ['Name', getCustomerName(selectedEnquiry)],
                      ['Email', getCustomerEmail(selectedEnquiry)],
                      ['Phone', getCustomerPhone(selectedEnquiry)],
                      ['Address', getCustomerAddress(selectedEnquiry)],
                      ['Auth Provider', formatLabel(getAuthProvider(selectedEnquiry))],
                      ['Customer ID', selectedEnquiry.customer?._id || selectedEnquiry.customer || 'N/A'],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-gray-800 bg-[#111b2b] p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
                        <p className="mt-2 break-words text-sm font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Enquiry Information</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      ['Source', formatLabel(selectedEnquiry.source)],
                      ['Status', formatLabel(selectedEnquiry.status)],
                      ['Created', formatDateTime(selectedEnquiry.createdAt)],
                      ['Updated', formatDateTime(selectedEnquiry.updatedAt)],
                      ['Estimated Purchase Value', formatCurrency(selectedEnquiry.totalEstimatedPrice)],
                      ['Products Count', String((selectedEnquiry.products || []).length)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-gray-800 bg-[#111b2b] p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
                        <p className="mt-2 break-words text-sm font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Products</h3>
                  <div className="mt-3 space-y-3">
                    {(selectedEnquiry.products || []).map((product) => (
                      <div key={`${selectedEnquiry._id}-${product.product}`} className="rounded-lg border border-gray-800 bg-[#111b2b] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-bold text-white">{product.nameSnapshot}</p>
                            <p className="mt-1 text-sm text-gray-400">
                              {[product.brandSnapshot, product.categorySnapshot, product.modelSnapshot].filter(Boolean).join(' | ') || 'No extra product details'}
                            </p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-500">
                              {formatLabel(product.typeSnapshot)}
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-white">
                              {product.intent === 'rent' ? 'Rental' : 'Purchase'}
                            </p>
                            <EnquiryOfferDetails product={product} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">Follow Up</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                    <div className="rounded-lg border border-gray-800 bg-[#111b2b] p-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Status</span>
                        <select
                          name="status"
                          value={detailForm.status}
                          onChange={handleDetailFormChange}
                          className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          {statusOptions.filter(Boolean).map((status) => (
                            <option key={status} value={status}>
                              {formatLabel(status)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={handleStatusSave}
                        disabled={savingStatus || detailForm.status === selectedEnquiry.status}
                        className="mt-3 w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingStatus ? 'Saving...' : 'Save Status'}
                      </button>
                    </div>

                    <div className="rounded-lg border border-gray-800 bg-[#111b2b] p-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Admin Notes</span>
                        <textarea
                          name="notes"
                          value={detailForm.notes}
                          onChange={handleDetailFormChange}
                          rows={5}
                          className="w-full resize-y rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Add follow-up notes for this enquiry"
                        />
                      </label>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNotesSave}
                          disabled={savingNotes || detailForm.notes === (selectedEnquiry.notes || '')}
                          className="rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-bold text-green-300 transition hover:bg-green-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingNotes ? 'Saving...' : 'Save Notes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedEnquiry.message && (
                  <div>
                    <h3 className="text-lg font-bold text-white">WhatsApp Message</h3>
                    <p className="mt-3 whitespace-pre-wrap rounded-lg border border-gray-800 bg-[#111b2b] p-4 text-sm leading-6 text-gray-300">
                      {selectedEnquiry.message}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {enquiryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0e1726] p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400">Delete Enquiry</p>
            <h2 className="mt-2 text-xl font-black text-white">Delete this enquiry?</h2>
            <div className="mt-4 rounded-xl border border-gray-800 bg-[#111b2b] p-4 text-sm text-gray-300">
              <p><span className="font-bold text-gray-500">Customer:</span> {getCustomerName(enquiryToDelete)}</p>
              <p className="mt-2"><span className="font-bold text-gray-500">Date:</span> {formatDateTime(enquiryToDelete.createdAt)}</p>
              <p className="mt-2"><span className="font-bold text-gray-500">Value:</span> {formatCurrency(enquiryToDelete.totalEstimatedPrice)}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              This will permanently remove this enquiry from the enquiry records.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeletingEnquiry}
                className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEnquiry}
                disabled={isDeletingEnquiry}
                className="rounded-lg border border-red-500/30 bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-900 disabled:opacity-70"
              >
                {isDeletingEnquiry ? 'Deleting...' : 'Delete Enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageEnquiries;
