import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import axios from '../utils/axiosInstance';

const statusOptions = ['', 'new', 'contacted', 'converted', 'closed', 'spam'];
const sourceOptions = ['', 'product_detail', 'cart', 'contact'];
const limitOptions = ['10', '20', '50', '100'];

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

const formatLabel = (value) => {
  if (!value) return 'All';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const initialFilters = {
  status: '',
  source: '',
  dateFrom: '',
  dateTo: '',
  limit: '20',
};

const ProductDemandReport = () => {
  const [reportRows, setReportRows] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDemandReport = async () => {
    setLoading(true);
    setErrorMessage('');

    const params = new URLSearchParams({ limit: filters.limit });
    if (filters.status) params.set('status', filters.status);
    if (filters.source) params.set('source', filters.source);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);

    try {
      const response = await axios.get(`/api/enquiries/stats/products?${params.toString()}`);
      setReportRows(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load product demand report';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.source, filters.dateFrom, filters.dateTo, filters.limit]);

  const reportSummary = useMemo(
    () =>
      reportRows.reduce(
        (summary, row) => ({
          products: summary.products + 1,
          enquiries: summary.enquiries + Number(row.totalEnquiries || 0),
          quantity: summary.quantity + Number(row.totalQuantityRequested || 0),
          value: summary.value + Number(row.totalEstimatedValue || 0),
        }),
        { products: 0, enquiries: 0, quantity: 0, value: 0 }
      ),
    [reportRows]
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

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Enquiry Analytics</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Product Demand Report</h1>
          </div>
          <button
            type="button"
            onClick={fetchDemandReport}
            disabled={loading}
            className="w-full rounded-lg border border-gray-700 bg-[#0e1726] px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Refresh
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Products', value: reportSummary.products, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
            { label: 'Enquiries', value: reportSummary.enquiries, color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
            { label: 'Quantity', value: reportSummary.quantity, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
            { label: 'Estimated Value', value: formatCurrency(reportSummary.value), color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_140px_auto] xl:items-end">
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
            <h2 className="text-xl font-bold text-white">Most Demanded Products</h2>
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
                onClick={fetchDemandReport}
                className="mt-4 rounded-lg border border-red-500/40 px-5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          ) : reportRows.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-gray-400">No demand data found.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px] text-left">
                  <thead className="bg-[#111b2b] text-xs uppercase tracking-widest text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Enquiries</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">Customers</th>
                      <th className="px-6 py-4">Estimated Value</th>
                      <th className="px-6 py-4">Latest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {reportRows.map((row, index) => (
                      <tr key={row.productId || row._id || row.productName} className="transition hover:bg-[#162033]">
                        <td className="px-6 py-4">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-sm font-black text-blue-300">
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-white">{row.productName || 'Unknown Product'}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {[row.brand, row.category, row.type].filter(Boolean).join(' | ') || 'No extra product details'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-white">{row.totalEnquiries || 0}</td>
                        <td className="px-6 py-4 text-sm font-bold text-white">{row.totalQuantityRequested || 0}</td>
                        <td className="px-6 py-4 text-sm font-bold text-white">{row.uniqueCustomerCount || 0}</td>
                        <td className="px-6 py-4 text-sm font-bold text-white">{formatCurrency(row.totalEstimatedValue)}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatDate(row.latestEnquiryDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-800 lg:hidden">
                {reportRows.map((row, index) => (
                  <div key={row.productId || row._id || row.productName} className="p-5">
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10 text-sm font-black text-blue-300">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">{row.productName || 'Unknown Product'}</p>
                        <p className="mt-1 text-sm text-gray-400">
                          {[row.brand, row.category, row.type].filter(Boolean).join(' | ') || 'No extra product details'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        ['Enquiries', row.totalEnquiries || 0],
                        ['Quantity', row.totalQuantityRequested || 0],
                        ['Customers', row.uniqueCustomerCount || 0],
                        ['Latest', formatDate(row.latestEnquiryDate)],
                        ['Value', formatCurrency(row.totalEstimatedValue)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-gray-800 bg-[#111b2b] p-3">
                          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{label}</p>
                          <p className="mt-1 break-words text-sm font-bold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default ProductDemandReport;
