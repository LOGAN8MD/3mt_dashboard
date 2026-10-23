import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../utils/axiosInstance';

const productTypes = ['machine', 'accessory', 'part', 'tool', 'spare'];
const statusOptions = ['all', 'pending', 'approved', 'rejected'];
const rentPeriods = ['day', 'week', 'month'];

const initialFormData = {
  name: '',
  type: '',
  category: '',
  subCategory: '',
  brand: '',
  description: '',
  size: '',
  model: '',
  price: '',
  stock: '',
  condition: 'new',
  availabilityType: 'sale',
  rentalPrice: '',
  rentPeriod: '',
  securityDeposit: '',
  availabilityStatus: 'available',
  availableFrom: '',
  availabilityNote: '',
  adminNote: '',
};

const defaultListingFields = {
  condition: 'new',
  availabilityType: 'sale',
  rentalPrice: '',
  rentPeriod: '',
  securityDeposit: '',
  availabilityStatus: 'available',
  availableFrom: '',
  availabilityNote: '',
};

const getImageUrl = (product) => product?.images?.[0]?.url || '';

const toFormData = (formData, images) => {
  const payload = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    payload.append(key, value);
  });

  images.forEach((image) => {
    payload.append('images', image);
  });

  return payload;
};

const getRequestDate = (request) =>
  request?.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A';

const getDateInputValue = (value) => {
  if (!value) return '';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

const getOfferSummary = (request) => {
  const availabilityType = request.availabilityType || 'sale';
  const salePrice = formatCurrency(request.price);
  const rentalPrice = `${formatCurrency(request.rentalPrice)} / ${request.rentPeriod || 'period'}`;

  if (availabilityType === 'rent') return rentalPrice;
  if (availabilityType === 'both') return `${salePrice} | ${rentalPrice}`;
  return salePrice;
};

const getStatusBadgeClass = (status) => {
  const statusStyles = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    approved: 'border-green-500/30 bg-green-500/10 text-green-300',
    rejected: 'border-red-500/30 bg-red-500/10 text-red-300',
  };

  return statusStyles[status] || 'border-blue-500/30 bg-blue-500/10 text-blue-300';
};

const PendingProducts = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [replacementImages, setReplacementImages] = useState([]);
  const [deletingRequest, setDeletingRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectReason, setRejectReason] = useState('');
  const [fieldOptions, setFieldOptions] = useState({ categories: [], brands: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const isEditable = selectedRequest?.status === 'pending';
  const isUsedMachine = formData.type === 'machine' && formData.condition === 'used';
  const includesSale = !isUsedMachine || ['sale', 'both'].includes(formData.availabilityType);
  const includesRent = isUsedMachine && ['rent', 'both'].includes(formData.availabilityType);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const response = await axios.get(`/api/pending-products/admin${query}`);
      setRequests(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load pending products';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const fetchFieldOptions = async () => {
      try {
        const response = await axios.get('/api/products/filter-options');
        setFieldOptions({
          categories: response.data?.categories || [],
          brands: response.data?.brands || [],
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchFieldOptions();
  }, []);

  const stats = useMemo(
    () => ({
      visible: requests.length,
      pending: requests.filter((request) => request.status === 'pending').length,
      approved: requests.filter((request) => request.status === 'approved').length,
      rejected: requests.filter((request) => request.status === 'rejected').length,
    }),
    [requests]
  );

  const openRequest = (request) => {
    setSelectedRequest(request);
    setFormData({
      name: request.name || '',
      type: request.type || '',
      category: request.category || '',
      subCategory: request.subCategory || '',
      brand: request.brand || '',
      description: request.description || '',
      size: request.size || '',
      model: request.model || '',
      price: request.price ?? '',
      stock: request.stock ?? '',
      condition: request.condition || 'new',
      availabilityType: request.availabilityType || 'sale',
      rentalPrice: request.rentalPrice ?? '',
      rentPeriod: request.rentPeriod || '',
      securityDeposit: request.securityDeposit ?? '',
      availabilityStatus: request.availabilityStatus || 'available',
      availableFrom: getDateInputValue(request.availableFrom),
      availabilityNote: request.availabilityNote || '',
      adminNote: request.adminNote || '',
    });
    setReplacementImages([]);
    setRejectReason('');
    setFormErrors({});
  };

  const closeRequest = () => {
    setSelectedRequest(null);
    setReplacementImages([]);
    setRejectReason('');
    setFormErrors({});
  };

  const openDeleteConfirm = (request) => {
    setDeletingRequest(request);
  };

  const closeDeleteConfirm = () => {
    if (!isDeleting) {
      setDeletingRequest(null);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => {
      if (name === 'type' && value !== 'machine') {
        return {
          ...currentData,
          type: value,
          ...defaultListingFields,
          stock: currentData.condition === 'used' ? '' : currentData.stock,
        };
      }

      return { ...currentData, [name]: value };
    });
    setFormErrors((currentErrors) => ({ ...currentErrors, [name]: '' }));
  };

  const handleConditionChange = (condition) => {
    if (!isEditable) return;

    setFormData((currentData) => ({
      ...currentData,
      ...defaultListingFields,
      condition,
      stock: condition === 'used' ? '1' : '',
    }));
    setFormErrors({});
  };

  const handleAvailabilityTypeChange = (event) => {
    const availabilityType = event.target.value;

    setFormData((currentData) => {
      let availabilityStatus = currentData.availabilityStatus;
      if (availabilityType === 'sale' && availabilityStatus === 'on_rent') {
        availabilityStatus = 'available';
      }
      if (availabilityType === 'rent' && availabilityStatus === 'sold') {
        availabilityStatus = 'available';
      }

      return {
        ...currentData,
        availabilityType,
        availabilityStatus,
        rentPeriod:
          ['rent', 'both'].includes(availabilityType) && !currentData.rentPeriod
            ? 'month'
            : currentData.rentPeriod,
      };
    });
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      price: '',
      rentalPrice: '',
      rentPeriod: '',
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setReplacementImages(files.slice(0, 5));
    event.target.value = '';
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Product name is required.';
    if (!formData.type) errors.type = 'Product type is required.';
    if (!formData.category.trim()) errors.category = 'Category is required.';
    if (includesSale && (!formData.price || Number(formData.price) <= 0)) {
      errors.price = 'Sale price must be greater than zero.';
    }
    if (includesRent && (!formData.rentalPrice || Number(formData.rentalPrice) <= 0)) {
      errors.rentalPrice = 'Rental price must be greater than zero.';
    }
    if (includesRent && !formData.rentPeriod) {
      errors.rentPeriod = 'Select a rent period.';
    }
    if (formData.securityDeposit && Number(formData.securityDeposit) < 0) {
      errors.securityDeposit = 'Security deposit cannot be negative.';
    }
    if (!isUsedMachine && formData.stock && Number(formData.stock) < 0) {
      errors.stock = 'Stock cannot be negative.';
    }

    return errors;
  };

  const getSubmissionData = () =>
    isUsedMachine
      ? {
          ...formData,
          price: includesSale ? formData.price : '',
          rentalPrice: includesRent ? formData.rentalPrice : '',
          rentPeriod: includesRent ? formData.rentPeriod : '',
          securityDeposit: includesRent ? formData.securityDeposit : '',
          stock: '1',
        }
      : { ...formData, ...defaultListingFields };

  const savePendingProduct = async () =>
    axios.put(
      `/api/pending-products/admin/${selectedRequest._id}`,
      toFormData(getSubmissionData(), replacementImages)
    );

  const updateRequestInList = (updatedRequest) => {
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request._id === updatedRequest._id ? updatedRequest : request
      )
    );
    setSelectedRequest(updatedRequest);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedRequest || selectedRequest.status !== 'pending') return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);

    try {
      const response = await savePendingProduct();
      updateRequestInList(response.data);
      setReplacementImages([]);
      toast.success('Pending product updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update pending product');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || selectedRequest.status !== 'pending') return;

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the highlighted fields before approval.');
      return;
    }

    setActing('approve');

    try {
      const savedResponse = await savePendingProduct();
      updateRequestInList(savedResponse.data);
      setReplacementImages([]);

      const response = await axios.patch(
        `/api/pending-products/admin/${selectedRequest._id}/approve`,
        { adminNote: formData.adminNote }
      );
      const approvedRequest = response.data.pendingProduct;
      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request._id === approvedRequest._id ? approvedRequest : request
        )
      );
      setSelectedRequest(approvedRequest);
      toast.success('Product approved and added to inventory');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve product');
    } finally {
      setActing('');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || selectedRequest.status !== 'pending') return;

    setActing('reject');

    try {
      const response = await axios.patch(
        `/api/pending-products/admin/${selectedRequest._id}/reject`,
        {
          rejectionReason: rejectReason,
          adminNote: formData.adminNote,
        }
      );
      updateRequestInList(response.data);
      toast.success('Product request rejected');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject product request');
    } finally {
      setActing('');
    }
  };

  const handleDelete = async () => {
    if (!deletingRequest) return;

    setIsDeleting(true);

    try {
      await axios.delete(`/api/pending-products/admin/${deletingRequest._id}`);
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request._id !== deletingRequest._id)
      );

      if (selectedRequest?._id === deletingRequest._id) {
        closeRequest();
      }

      setDeletingRequest(null);
      toast.success('Pending product record deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete pending product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Review Queue</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Pending Products</h1>
            <p className="mt-2 text-sm text-gray-400">Review user submissions before they enter inventory.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-700 bg-[#0e1726] px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              aria-label="Filter pending products by status"
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
            { label: 'Visible', value: stats.visible, color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
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
            <h2 className="text-xl font-bold text-white">
              {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests
            </h2>
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
              <p className="text-sm font-semibold text-gray-400">No {statusFilter === 'all' ? '' : statusFilter} product requests found.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] text-left">
                  <thead className="bg-[#111b2b] text-xs uppercase tracking-widest text-gray-500">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Submitted By</th>
                      <th className="px-6 py-4">Offer</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
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
                              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                                {request.brand || 'No Brand'} · {request.condition === 'used' ? 'Second-Hand' : 'New'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">{request.submittedBy?.name || 'Unknown'}</td>
                        <td className="max-w-[240px] px-6 py-4 text-sm font-bold text-gray-200">{getOfferSummary(request)}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{getRequestDate(request)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openRequest(request)}
                              className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                            >
                              {request.status === 'pending' ? 'Review' : 'View'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteConfirm(request)}
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
                        <p className="mt-1 text-sm text-gray-400">{request.submittedBy?.name || 'Unknown'}</p>
                        <p className="mt-1 text-xs font-bold uppercase text-gray-500">
                          {request.condition === 'used' ? 'Second-Hand' : 'New'} · {request.availabilityType || 'sale'}
                        </p>
                        <p className="mt-2 text-sm font-bold text-gray-200">{getOfferSummary(request)}</p>
                        <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusBadgeClass(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => openRequest(request)}
                        className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 hover:text-white"
                      >
                        {request.status === 'pending' ? 'Review' : 'View'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteConfirm(request)}
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

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0e1726] shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 bg-[#1b2128] px-6 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Review Product Request</h2>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${getStatusBadgeClass(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  Submitted by {selectedRequest.submittedBy?.name || 'Unknown'} on {getRequestDate(selectedRequest)}
                </p>
              </div>
              <button type="button" onClick={closeRequest} aria-label="Close product review" className="text-3xl font-bold text-gray-400 transition hover:text-white">&times;</button>
            </div>

            <div className="overflow-y-auto p-6">
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

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Product Name</label>
                    <input name="name" value={formData.name} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                    {formErrors.name && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.name}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Type</label>
                    <select name="type" value={formData.type} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60">
                      <option value="">Select Type</option>
                      {productTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                    {formErrors.type && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.type}</p>}
                  </div>
                  {formData.type === 'machine' && (
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Machine Condition</label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Machine condition">
                        <button
                          type="button"
                          onClick={() => handleConditionChange('new')}
                          disabled={!isEditable}
                          aria-pressed={formData.condition === 'new'}
                          className={`rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            formData.condition === 'new'
                              ? 'border-blue-500 bg-blue-600/15 text-white'
                              : 'border-gray-700 bg-[#1b2128] text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <span className="block font-bold">New Machine</span>
                          <span className="mt-1 block text-xs text-gray-400">Standard sale listing.</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConditionChange('used')}
                          disabled={!isEditable}
                          aria-pressed={formData.condition === 'used'}
                          className={`rounded-lg border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                            formData.condition === 'used'
                              ? 'border-amber-500 bg-amber-500/10 text-white'
                              : 'border-gray-700 bg-[#1b2128] text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          <span className="block font-bold">Second-Hand Machine</span>
                          <span className="mt-1 block text-xs text-gray-400">Sale, rental, or combined listing.</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Category</label>
                    <input name="category" list="pendingCategoryOptions" value={formData.category} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                    <datalist id="pendingCategoryOptions">
                      {fieldOptions.categories.map((category) => (
                        <option key={category} value={category} />
                      ))}
                    </datalist>
                    {formErrors.category && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.category}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Sub Category</label>
                    <input name="subCategory" value={formData.subCategory} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Brand</label>
                    <input name="brand" list="pendingBrandOptions" value={formData.brand} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                    <datalist id="pendingBrandOptions">
                      {fieldOptions.brands.map((brand) => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Model</label>
                    <input name="model" value={formData.model} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Size</label>
                    <input name="size" value={formData.size} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                  </div>
                  {includesSale && (
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                        {isUsedMachine ? 'Sale Price (₹)' : 'Price (₹)'}
                      </label>
                      <input type="number" name="price" min="0" step="0.01" value={formData.price} onChange={handleFormChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                      {formErrors.price && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.price}</p>}
                    </div>
                  )}
                  {!isUsedMachine && (
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Stock</label>
                      <input type="number" name="stock" min="0" value={formData.stock} onChange={handleFormChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                      {formErrors.stock && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.stock}</p>}
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} rows="4" className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Admin Note</label>
                    <textarea name="adminNote" value={formData.adminNote} onChange={handleFormChange} disabled={selectedRequest.status !== 'pending'} rows="3" className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-blue-500 disabled:opacity-60" />
                  </div>
                </div>

                {isUsedMachine && (
                  <div className="space-y-5 border-y border-gray-800 py-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Second-Hand Listing</h3>
                      <p className="mt-1 text-sm text-gray-500">Confirm the offer terms and current machine availability before approval.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Available For</label>
                        <select name="availabilityType" value={formData.availabilityType} onChange={handleAvailabilityTypeChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-amber-500 disabled:opacity-60">
                          <option value="sale">Sale</option>
                          <option value="rent">Rent</option>
                          <option value="both">Sale and Rent</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Availability Status</label>
                        <select name="availabilityStatus" value={formData.availabilityStatus} onChange={handleFormChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-amber-500 disabled:opacity-60">
                          <option value="available">Available</option>
                          {includesRent && <option value="on_rent">On Rent</option>}
                          <option value="unavailable">Unavailable</option>
                          {includesSale && <option value="sold">Sold</option>}
                        </select>
                      </div>

                      {includesRent && (
                        <>
                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Rental Price (₹)</label>
                            <input type="number" name="rentalPrice" min="0" step="0.01" value={formData.rentalPrice} onChange={handleFormChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-amber-500 disabled:opacity-60" />
                            {formErrors.rentalPrice && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.rentalPrice}</p>}
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Rent Period</label>
                            <select name="rentPeriod" value={formData.rentPeriod} onChange={handleFormChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-amber-500 disabled:opacity-60">
                              {rentPeriods.map((period) => (
                                <option key={period} value={period}>Per {period}</option>
                              ))}
                            </select>
                            {formErrors.rentPeriod && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.rentPeriod}</p>}
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Security Deposit (₹)</label>
                            <input type="number" name="securityDeposit" min="0" step="0.01" value={formData.securityDeposit} onChange={handleFormChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-amber-500 disabled:opacity-60" />
                            {formErrors.securityDeposit && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.securityDeposit}</p>}
                          </div>
                        </>
                      )}

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Expected Available Date</label>
                        <input type="date" name="availableFrom" value={formData.availableFrom} onChange={handleFormChange} disabled={!isEditable} className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-amber-500 disabled:opacity-60" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Availability Note</label>
                        <textarea name="availabilityNote" value={formData.availabilityNote} onChange={handleFormChange} disabled={!isEditable} rows="3" className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-amber-500 disabled:opacity-60" />
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="rounded-xl border border-gray-800 bg-[#111b2b] p-4">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">Replace Images</label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input type="file" accept="image/*" capture="environment" multiple onChange={handleImageChange} id="pendingReviewCameraInput" style={{ display: 'none' }} />
                      <button type="button" onClick={() => document.getElementById('pendingReviewCameraInput').click()} className="flex-1 rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-bold text-gray-300 transition hover:border-gray-500">
                        <span className="mr-2">📸</span> Take Photo
                      </button>

                      <input type="file" accept="image/*" multiple onChange={handleImageChange} id="pendingReviewGalleryInput" style={{ display: 'none' }} />
                      <button type="button" onClick={() => document.getElementById('pendingReviewGalleryInput').click()} className="flex-1 rounded-lg border border-blue-500/30 bg-blue-600/20 px-4 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-500">
                        <span className="mr-2">🖼</span> Upload from Gallery
                      </button>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-gray-500">
                      {replacementImages.length > 0 ? `${replacementImages.length} replacement image(s) selected.` : 'Leave empty to keep submitted images.'}
                    </p>
                  </div>
                )}

                {selectedRequest.status === 'pending' ? (
                  <div className="grid grid-cols-1 gap-3 border-t border-gray-800 pt-6 md:grid-cols-[1fr_1fr_1fr]">
                    <button type="submit" disabled={saving || Boolean(acting)} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-black uppercase tracking-widest text-blue-300 transition hover:bg-blue-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                      {saving ? 'Saving...' : 'Save Edits'}
                    </button>
                    <button type="button" onClick={handleApprove} disabled={saving || Boolean(acting)} className="rounded-lg border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-black uppercase tracking-widest text-green-300 transition hover:bg-green-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                      {acting === 'approve' ? 'Saving & Approving...' : 'Approve'}
                    </button>
                    <div className="space-y-3">
                      <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Reject reason" className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-medium text-white outline-none focus:border-red-500" />
                      <button type="button" onClick={handleReject} disabled={saving || Boolean(acting)} className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-widest text-red-300 transition hover:bg-red-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
                        {acting === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-800 bg-[#111b2b] p-5 text-sm text-gray-300">
                    <p>This request is {selectedRequest.status}. Reviewed by {selectedRequest.reviewedBy?.name || 'admin'}.</p>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(selectedRequest)}
                      className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white"
                    >
                      Delete Record
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {deletingRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#0e1726] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Delete Pending Product</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Delete <span className="font-bold text-white">{deletingRequest.name}</span> from PendingProduct records?
            </p>
            <p className="mt-3 rounded-lg border border-gray-800 bg-[#111b2b] p-3 text-xs leading-relaxed text-gray-400">
              {deletingRequest.status === 'approved'
                ? 'This is approved, so Cloudinary images will be kept because the live product uses them.'
                : 'This is not approved, so its Cloudinary images will also be deleted.'}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
                className="rounded-lg border border-gray-700 px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingProducts;
