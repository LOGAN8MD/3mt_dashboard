import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import axios from '../utils/axiosInstance';
import {
  CUSTOMER_ROLE,
  USER_MANAGEMENT_ROLES,
  getRoleLabel,
} from '../utils/roles';

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
  if (!value) return 'N/A';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const initialCustomerFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
};

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerEnquiries, setCustomerEnquiries] = useState([]);
  const [customerFilters, setCustomerFilters] = useState(initialCustomerFilters);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleUpdateForm, setRoleUpdateForm] = useState({ role: CUSTOMER_ROLE });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const params = new URLSearchParams({ role: CUSTOMER_ROLE });

      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      if (customerFilters.dateFrom) {
        params.set('dateFrom', customerFilters.dateFrom);
      }

      if (customerFilters.dateTo) {
        params.set('dateTo', customerFilters.dateTo);
      }

      const response = await axios.get(`/api/users?${params.toString()}`);
      setCustomers(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load customers';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(customerFilters.search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [customerFilters.search]);

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, customerFilters.dateFrom, customerFilters.dateTo]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setCustomerFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setCustomerFilters(initialCustomerFilters);
    setDebouncedSearch('');
  };

  const hasActiveFilters = Boolean(
    customerFilters.search || customerFilters.dateFrom || customerFilters.dateTo
  );

  const customerStats = useMemo(
    () =>
      customers.reduce(
        (stats, customer) => ({
          total: stats.total + 1,
          verified: customer.isVerified ? stats.verified + 1 : stats.verified,
          emailVerified: customer.verifiedEmail ? stats.emailVerified + 1 : stats.emailVerified,
        }),
        { total: 0, verified: 0, emailVerified: 0 }
      ),
    [customers]
  );

  const historyStats = useMemo(
    () =>
      customerEnquiries.reduce(
        (stats, enquiry) => ({
          total: stats.total + 1,
          quantity:
            stats.quantity +
            (enquiry.products || []).reduce(
              (productTotal, product) => productTotal + Number(product.quantity || 0),
              0
            ),
          value: stats.value + Number(enquiry.totalEstimatedPrice || 0),
          latest:
            !stats.latest || new Date(enquiry.createdAt) > new Date(stats.latest)
              ? enquiry.createdAt
              : stats.latest,
        }),
        { total: 0, quantity: 0, value: 0, latest: null }
      ),
    [customerEnquiries]
  );

  const openRoleModal = (customer) => {
    setSelectedCustomer(customer);
    setRoleUpdateForm({ role: customer.role || CUSTOMER_ROLE });
  };

  const closeRoleModal = () => {
    setSelectedCustomer(null);
    setRoleUpdateForm({ role: CUSTOMER_ROLE });
  };

  const openDeleteModal = (customer) => {
    setCustomerToDelete(customer);
  };

  const closeDeleteModal = () => {
    setCustomerToDelete(null);
    setIsDeletingCustomer(false);
  };

  const openHistoryModal = async (customer) => {
    setHistoryCustomer(customer);
    setCustomerEnquiries([]);
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const response = await axios.get(`/api/enquiries/customer/${customer._id}?limit=100`);
      setCustomerEnquiries(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load customer enquiry history';
      setHistoryError(message);
      toast.error(message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setHistoryCustomer(null);
    setCustomerEnquiries([]);
    setHistoryLoading(false);
    setHistoryError('');
  };

  const handleRoleUpdate = async (event) => {
    event.preventDefault();

    if (!selectedCustomer) return;

    if (!USER_MANAGEMENT_ROLES.includes(roleUpdateForm.role)) {
      toast.error('Select a valid role');
      return;
    }

    setIsUpdatingRole(true);

    try {
      const response = await axios.patch(`/api/users/${selectedCustomer._id}/role`, {
        role: roleUpdateForm.role,
      });

      if (response.data.role === CUSTOMER_ROLE) {
        setCustomers((currentCustomers) =>
          currentCustomers.map((customer) =>
            customer._id === response.data._id ? { ...customer, ...response.data } : customer
          )
        );
      } else {
        setCustomers((currentCustomers) =>
          currentCustomers.filter((customer) => customer._id !== response.data._id)
        );
      }

      closeRoleModal();
      toast.success('Customer role updated successfully');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update customer role';
      toast.error(message);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    setIsDeletingCustomer(true);

    try {
      const response = await axios.delete(`/api/users/${customerToDelete._id}`);
      setCustomers((currentCustomers) =>
        currentCustomers.filter((customer) => customer._id !== customerToDelete._id)
      );

      if (historyCustomer?._id === customerToDelete._id) {
        closeHistoryModal();
      }

      if (selectedCustomer?._id === customerToDelete._id) {
        closeRoleModal();
      }

      const deletedEnquiriesCount = response.data?.deletedEnquiriesCount || 0;
      toast.success(
        `Customer deleted successfully. ${deletedEnquiriesCount} related enquiry record${deletedEnquiriesCount === 1 ? '' : 's'} deleted.`
      );
      closeDeleteModal();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete customer';
      toast.error(message);
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Customer Accounts</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Customers</h1>
          </div>
          <button
            type="button"
            onClick={fetchCustomers}
            disabled={loading}
            className="w-full rounded-lg border border-gray-700 bg-[#0e1726] px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Refresh
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Customers', value: customerStats.total, color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
            { label: 'Verified', value: customerStats.verified, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
            { label: 'Email Verified', value: customerStats.emailVerified, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
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

        <section className="mb-8 rounded-xl border border-gray-800 bg-[#0e1726] p-5 shadow-lg">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                Search Customer
              </label>
              <input
                type="search"
                name="search"
                value={customerFilters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, email, or phone"
                className="w-full rounded-lg border border-gray-700 bg-[#111b2b] px-4 py-3 text-sm font-medium text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                From Date
              </label>
              <input
                type="date"
                name="dateFrom"
                value={customerFilters.dateFrom}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#111b2b] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                To Date
              </label>
              <input
                type="date"
                name="dateTo"
                value={customerFilters.dateTo}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-700 bg-[#111b2b] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters || loading}
              className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-300 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-gray-800 bg-[#0e1726] shadow-lg">
          <div className="border-b border-gray-800 px-6 py-5">
            <h2 className="text-xl font-bold text-white">Customer List</h2>
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
                onClick={fetchCustomers}
                className="mt-4 rounded-lg border border-red-500/40 px-5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
              >
                Retry
              </button>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-gray-400">No customer accounts found.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] text-left">
                  <thead className="bg-[#111b2b] text-xs uppercase tracking-widest text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Verified</th>
                      <th className="px-6 py-4">Created</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {customers.map((customer) => (
                      <tr key={customer._id} className="transition hover:bg-[#162033]">
                        <td className="px-6 py-4 text-sm font-bold text-white">{customer.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{customer.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{customer.phone || 'Not added'}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {customer.verifiedEmail ? 'Email' : customer.verifiedPhone ? 'Phone' : customer.isVerified ? 'Account' : 'Pending'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openHistoryModal(customer)}
                              className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-bold text-green-300 transition hover:bg-green-500/20 hover:text-white"
                            >
                              Enquiries
                            </button>
                            <button
                              type="button"
                              onClick={() => openRoleModal(customer)}
                              className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                            >
                              Change Role
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(customer)}
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

              <div className="divide-y divide-gray-800 md:hidden">
                {customers.map((customer) => (
                  <div key={customer._id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white">{customer.name || 'N/A'}</p>
                        <p className="mt-1 text-sm text-gray-400">{customer.email || 'N/A'}</p>
                      </div>
                      <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-purple-300">
                        {getRoleLabel(customer.role)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-400">Phone: {customer.phone || 'Not added'}</p>
                    <p className="mt-2 text-xs uppercase tracking-widest text-gray-500">
                      Created {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => openHistoryModal(customer)}
                        className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-300 transition hover:bg-green-500/20 hover:text-white"
                      >
                        Enquiries
                      </button>
                      <button
                        type="button"
                        onClick={() => openRoleModal(customer)}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                      >
                        Change Role
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(customer)}
                        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white"
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

      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-800 bg-[#0e1726] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Customer Enquiry History</p>
                <h2 className="mt-1 text-2xl font-black text-white">{historyCustomer.name || 'N/A'}</h2>
                <p className="mt-1 text-sm text-gray-400">{historyCustomer.email || 'N/A'}</p>
              </div>
              <button
                type="button"
                onClick={closeHistoryModal}
                className="rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-300 transition hover:border-gray-500 hover:text-white"
              >
                Close
              </button>
            </div>

            {historyLoading ? (
              <div className="space-y-3 p-6">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-lg bg-[#1b2128]" />
                ))}
              </div>
            ) : historyError ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-red-400">{historyError}</p>
                <button
                  type="button"
                  onClick={() => openHistoryModal(historyCustomer)}
                  className="mt-4 rounded-lg border border-red-500/40 px-5 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: 'Enquiries', value: historyStats.total, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
                    { label: 'Quantity', value: historyStats.quantity, color: 'border-green-500/40 bg-green-500/10 text-green-400' },
                    { label: 'Estimated Value', value: formatCurrency(historyStats.value), color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
                    { label: 'Latest', value: formatDate(historyStats.latest), color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-gray-800 bg-[#111b2b] p-4">
                      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border ${stat.color}`}>
                        <span className="text-xs font-black">{stat.label.charAt(0)}</span>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
                      <p className="mt-2 break-words text-xl font-black text-white">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {customerEnquiries.length === 0 ? (
                  <div className="rounded-xl border border-gray-800 bg-[#111b2b] p-8 text-center">
                    <p className="text-sm font-semibold text-gray-400">No enquiries found for this customer.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerEnquiries.map((enquiry) => (
                      <div key={enquiry._id} className="rounded-xl border border-gray-800 bg-[#111b2b] p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                              {formatLabel(enquiry.source)} | {formatDate(enquiry.createdAt)}
                            </p>
                            <p className="mt-2 text-lg font-black text-white">
                              {formatCurrency(enquiry.totalEstimatedPrice)}
                            </p>
                          </div>
                          <span className="w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300">
                            {formatLabel(enquiry.status)}
                          </span>
                        </div>

                        <div className="mt-4 space-y-3">
                          {(enquiry.products || []).map((product) => (
                            <div key={`${enquiry._id}-${product.product}`} className="rounded-lg border border-gray-800 bg-[#0e1726] p-4">
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
                                    {formatCurrency(product.priceSnapshot)} x {product.quantity}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-400">{formatCurrency(product.lineTotal)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#0e1726] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Update Customer Role</h2>
            <div className="mt-4 rounded-xl border border-gray-800 bg-[#1b2128] p-4 text-sm text-gray-300">
              <p><span className="font-bold text-gray-500">Name:</span> {selectedCustomer.name || 'N/A'}</p>
              <p className="mt-2"><span className="font-bold text-gray-500">Email:</span> {selectedCustomer.email || 'N/A'}</p>
              <p className="mt-2">
                <span className="font-bold text-gray-500">Current Role:</span>{' '}
                <span className="font-bold text-white">{getRoleLabel(selectedCustomer.role)}</span>
              </p>
            </div>
            <form onSubmit={handleRoleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Update Role To</label>
                <select
                  value={roleUpdateForm.role}
                  onChange={(event) => setRoleUpdateForm({ role: event.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {USER_MANAGEMENT_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {getRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={closeRoleModal}
                  disabled={isUpdatingRole}
                  className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  className="rounded-lg border border-blue-500/30 bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:opacity-70"
                >
                  {isUpdatingRole ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#0e1726] p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400">Delete Customer</p>
            <h2 className="mt-2 text-xl font-black text-white">Delete this customer?</h2>
            <div className="mt-4 rounded-xl border border-gray-800 bg-[#111b2b] p-4 text-sm text-gray-300">
              <p><span className="font-bold text-gray-500">Name:</span> {customerToDelete.name || 'N/A'}</p>
              <p className="mt-2"><span className="font-bold text-gray-500">Email:</span> {customerToDelete.email || 'N/A'}</p>
              <p className="mt-2"><span className="font-bold text-gray-500">Phone:</span> {customerToDelete.phone || 'Not added'}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              This will permanently delete this customer account and all enquiry records linked to this customer.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeletingCustomer}
                className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCustomer}
                disabled={isDeletingCustomer}
                className="rounded-lg border border-red-500/30 bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-900 disabled:opacity-70"
              >
                {isDeletingCustomer ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageCustomers;
