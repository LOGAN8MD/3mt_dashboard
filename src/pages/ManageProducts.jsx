import React, { useState, useEffect, useMemo } from 'react';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const productTypes = ['machine', 'part', 'tool', 'accessory', 'spare'];
const rentPeriods = ['day', 'week', 'month'];
const conditionOptions = ['new', 'used'];
const availabilityTypeOptions = ['sale', 'rent', 'both'];
const availabilityStatusOptions = ['available', 'on_rent', 'unavailable', 'sold'];

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

const getOfferSummary = (product) => {
  const availabilityType = product.availabilityType || 'sale';
  const salePrice = formatCurrency(product.price);
  const rentalPrice = `${formatCurrency(product.rentalPrice)} / ${product.rentPeriod || 'period'}`;

  if (availabilityType === 'rent') return rentalPrice;
  if (availabilityType === 'both') return `${salePrice} | ${rentalPrice}`;
  return salePrice;
};

const getAvailabilityBadgeClass = (status) => {
  const statusStyles = {
    available: 'border-green-500/30 bg-green-500/10 text-green-300',
    on_rent: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    unavailable: 'border-gray-500/30 bg-gray-500/10 text-gray-300',
    sold: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  };

  return statusStyles[status] || statusStyles.available;
};

const getDisplayLabel = (value) =>
  value === 'on_rent'
    ? 'On Rent'
    : value.charAt(0).toUpperCase() + value.slice(1);

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form State for Editing
  const [formData, setFormData] = useState(initialFormData);
  const [newImages, setNewImages] = useState([]); // File objects for new images
  const [existingImages, setExistingImages] = useState([]); // URLs for display
  const [formErrors, setFormErrors] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    brand: 'all',
    condition: 'all',
    availabilityType: 'all',
    availabilityStatus: 'all',
    stock: 'all',
  });
  const isUsedMachine = formData.type === 'machine' && formData.condition === 'used';
  const includesSale = !isUsedMachine || ['sale', 'both'].includes(formData.availabilityType);
  const includesRent = isUsedMachine && ['rent', 'both'].includes(formData.availabilityType);

  const filterOptions = useMemo(() => {
    const normalizeOptions = (values) =>
      Array.from(new Set(values.filter(Boolean))).sort((first, second) =>
        first.localeCompare(second)
      );

    return {
      categories: normalizeOptions(products.map((product) => product.category)),
      brands: normalizeOptions(products.map((product) => product.brand)),
      types: normalizeOptions(products.map((product) => product.type)),
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchText = filters.search.trim().toLowerCase();

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.category,
        product.subCategory,
        product.type,
        product.model,
        product.size,
        product.condition,
        product.availabilityType,
        product.availabilityStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const stockValue = Number(product.stock || 0);

      const matchesSearch = !searchText || searchableText.includes(searchText);
      const matchesType = filters.type === 'all' || product.type === filters.type;
      const matchesCategory =
        filters.category === 'all' || product.category === filters.category;
      const matchesBrand = filters.brand === 'all' || product.brand === filters.brand;
      const matchesCondition =
        filters.condition === 'all' || (product.condition || 'new') === filters.condition;
      const matchesAvailabilityType =
        filters.availabilityType === 'all' ||
        (product.availabilityType || 'sale') === filters.availabilityType;
      const matchesAvailabilityStatus =
        filters.availabilityStatus === 'all' ||
        (product.availabilityStatus || 'available') === filters.availabilityStatus;
      const matchesStock =
        filters.stock === 'all' ||
        (filters.stock === 'in-stock' && stockValue > 0) ||
        (filters.stock === 'out-of-stock' && stockValue <= 0);

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesBrand &&
        matchesCondition &&
        matchesAvailabilityType &&
        matchesAvailabilityStatus &&
        matchesStock
      );
    });
  }, [filters, products]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      brand: 'all',
      condition: 'all',
      availabilityType: 'all',
      availabilityStatus: 'all',
      stock: 'all',
    });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products/inventory');
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load products');
      setLoading(false);
    }
  };

  // --- DELETE LOGIC --- //
  const openDeleteModal = (id) => {
    setDeletingProductId(id);
  };

  const closeDeleteModal = () => {
    setDeletingProductId(null);
  };

  const confirmDelete = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/products/${deletingProductId}`);
      toast.success('Product deleted successfully');
      fetchProducts();
      closeDeleteModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- UPDATE LOGIC --- //
  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      type: product.type || '',
      category: product.category || '',
      subCategory: product.subCategory || '',
      brand: product.brand || '',
      description: product.description || '',
      size: product.size || '',
      model: product.model || '',
      price: product.price ?? '',
      stock: product.stock ?? '',
      condition: product.condition || 'new',
      availabilityType: product.availabilityType || 'sale',
      rentalPrice: product.rentalPrice ?? '',
      rentPeriod: product.rentPeriod || '',
      securityDeposit: product.securityDeposit ?? '',
      availabilityStatus: product.availabilityStatus || 'available',
      availableFrom: getDateInputValue(product.availableFrom),
      availabilityNote: product.availabilityNote || '',
    });
    setExistingImages(product.images || []);
    setNewImages([]);
    setFormErrors({});
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setNewImages([]);
    setExistingImages([]);
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
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

  const handleImageChange = (e) => {
    // When new images are selected, we override or append depending on requirements.
    // For now, if they select new images, it will overwrite the old ones on backend.
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setNewImages((currentImages) => [...currentImages, ...selectedFiles].slice(0, 5));
    e.target.value = '';
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, imageIndex) => imageIndex !== index));
  };

  const validateEditForm = () => {
    const errors = {};

    if (!formData.name?.trim()) errors.name = 'Product name is required.';
    if (!formData.type) errors.type = 'Product type is required.';
    if (!formData.category?.trim()) errors.category = 'Category is required.';
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const productData = new FormData();
    const submissionData = isUsedMachine
      ? {
          ...formData,
          price: includesSale ? formData.price : '',
          rentalPrice: includesRent ? formData.rentalPrice : '',
          rentPeriod: includesRent ? formData.rentPeriod : '',
          securityDeposit: includesRent ? formData.securityDeposit : '',
          stock: '1',
        }
      : { ...formData, ...defaultListingFields };

    Object.keys(submissionData).forEach((key) => {
      productData.append(key, submissionData[key]);
    });

    // Append new images
    newImages.forEach((img) => {
      productData.append('images', img);
    });

    try {
      setIsUpdating(true);
      await axios.put(`/api/products/${editingProduct._id}`, productData);
      toast.success('✅ Product updated successfully!');
      fetchProducts();
      closeEditModal();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || '❌ Failed to update product!');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Manage Inventory</h1>
            </div>

            <div className="bg-[#0e1726] rounded-xl shadow-lg border border-gray-800 overflow-hidden">
              <div className="border-b border-gray-800 px-6 py-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Update & Delete Products</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Showing {filteredProducts.length} of {products.length} products
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="self-start rounded-lg border border-gray-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-300 transition hover:border-gray-500 hover:text-white sm:self-auto"
                  >
                    Clear Filters
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Search</label>
                    <input
                      type="search"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Search name, brand, category, model..."
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Type</label>
                    <select
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Types</option>
                      {filterOptions.types.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Condition</label>
                    <select
                      name="condition"
                      value={filters.condition}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Conditions</option>
                      {conditionOptions.map((condition) => (
                        <option key={condition} value={condition}>{getDisplayLabel(condition)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Offer Type</label>
                    <select
                      name="availabilityType"
                      value={filters.availabilityType}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Offers</option>
                      {availabilityTypeOptions.map((availabilityType) => (
                        <option key={availabilityType} value={availabilityType}>
                          {availabilityType === 'both' ? 'Sale and Rent' : getDisplayLabel(availabilityType)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Availability</label>
                    <select
                      name="availabilityStatus"
                      value={filters.availabilityStatus}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Statuses</option>
                      {availabilityStatusOptions.map((status) => (
                        <option key={status} value={status}>{getDisplayLabel(status)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Category</label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {filterOptions.categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Brand</label>
                    <select
                      name="brand"
                      value={filters.brand}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Brands</option>
                      {filterOptions.brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Stock</label>
                    <select
                      name="stock"
                      value={filters.stock}
                      onChange={handleFilterChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="all">All Stock</option>
                      <option value="in-stock">In Stock</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="p-10 text-center text-gray-500">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-lg">No products found. Start by adding a new product.</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-lg">No products match the current search or filters.</div>
              ) : (
                <>
                <div className="divide-y divide-gray-800 md:hidden">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="p-4">
                      <div className="flex gap-4">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="h-20 w-20 shrink-0 rounded-md border border-gray-700 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="h-20 w-20 shrink-0 rounded-md bg-gray-800 flex items-center justify-center text-gray-500 text-xs font-semibold">No IMG</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-gray-100 break-words">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{product.brand || 'No Brand'}</div>
                          <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${product.condition === 'used' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-blue-500/30 bg-blue-500/10 text-blue-300'}`}>
                            {product.condition === 'used' ? 'Second-Hand' : 'New'}
                          </span>
                          <div className="mt-3">
                            <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Category</span>
                            <span className="text-gray-300 break-words">{product.category || 'Uncategorized'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-800 bg-[#111b2b] p-3 sm:grid-cols-2">
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Offer</span>
                          <span className="mt-1 block text-sm font-bold text-gray-200">{getOfferSummary(product)}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Availability</span>
                          <span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${getAvailabilityBadgeClass(product.availabilityStatus || 'available')}`}>
                            {getDisplayLabel(product.availabilityStatus || 'available')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-400 transition hover:bg-blue-500/20 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(product._id)}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-500/20 hover:text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1b2128] text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                        <th className="px-6 py-4 font-bold">Image</th>
                        <th className="px-6 py-4 font-bold">Name</th>
                        <th className="px-6 py-4 font-bold">Offer</th>
                        <th className="px-6 py-4 font-bold">Availability</th>
                        <th className="px-6 py-4 font-bold">Category</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-[#1b2128]/50 transition duration-150">
                          <td className="px-6 py-4">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[0].url} 
                                alt={product.name} 
                                className="w-14 h-14 object-cover rounded-md border border-gray-700 shadow-sm"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-gray-800 rounded-md flex items-center justify-center text-gray-500 text-xs font-semibold">No IMG</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-100">{product.name}</div>
                            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{product.brand || 'No Brand'}</div>
                            <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${product.condition === 'used' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-blue-500/30 bg-blue-500/10 text-blue-300'}`}>
                              {product.condition === 'used' ? 'Second-Hand' : 'New'}
                            </span>
                          </td>
                          <td className="max-w-[240px] px-6 py-4 text-sm font-bold text-gray-200">{getOfferSummary(product)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${getAvailabilityBadgeClass(product.availabilityStatus || 'available')}`}>
                              {getDisplayLabel(product.availabilityStatus || 'available')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{product.category || 'Uncategorized'}</td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => openEditModal(product)}
                              className="text-blue-400 hover:text-white hover:bg-blue-500/20 px-4 py-2 mr-2 rounded-lg border border-transparent hover:border-blue-500/30 font-bold text-sm transition shadow-sm"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => openDeleteModal(product._id)}
                              className="text-red-400 hover:text-white hover:bg-red-500/20 px-4 py-2 rounded-lg border border-transparent hover:border-red-500/30 font-bold text-sm transition shadow-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          </div>
      {/* --- EDIT MODAL --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1726] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1b2128]">
              <h2 className="text-xl font-bold text-white tracking-wide">Edit Product</h2>
              <button type="button" onClick={closeEditModal} aria-label="Close product editor" className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <div className="border-b border-gray-800 pb-4">
                  <h3 className="text-lg font-bold text-white">Product Details</h3>
                  <p className="text-sm text-gray-500 mt-1">Update core product information used across the catalog.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                    {formErrors.name && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.name}</p>}
                  </div>
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</label>
                    <select name="type" value={formData.type} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white">
                      <option value="">Select Type</option>
                      {productTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {formErrors.type && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.type}</p>}
                  </div>
                  {formData.type === 'machine' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Machine Condition</label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label="Machine condition">
                        <button
                          type="button"
                          onClick={() => handleConditionChange('new')}
                          aria-pressed={formData.condition === 'new'}
                          className={`rounded-lg border p-4 text-left transition-colors ${
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
                          aria-pressed={formData.condition === 'used'}
                          className={`rounded-lg border p-4 text-left transition-colors ${
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
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                    <input type="text" name="category" value={formData.category} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                    {formErrors.category && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.category}</p>}
                  </div>
                  {/* Sub Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sub Category</label>
                    <input type="text" name="subCategory" value={formData.subCategory} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                  </div>
                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Brand</label>
                    <input type="text" name="brand" value={formData.brand} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                  </div>
                  {/* Price */}
                  {includesSale && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {isUsedMachine ? 'Sale Price (₹)' : 'Price (₹)'}
                      </label>
                      <input type="number" name="price" min="0" step="0.01" value={formData.price} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                      {formErrors.price && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.price}</p>}
                    </div>
                  )}
                  {/* Size */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Size</label>
                    <input type="text" name="size" value={formData.size} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                  </div>
                  {/* Model */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Model</label>
                    <input type="text" name="model" value={formData.model} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                  </div>
                  {/* Stock */}
                  {!isUsedMachine && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stock Inventory</label>
                      <input type="number" name="stock" min="0" value={formData.stock} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                      {formErrors.stock && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.stock}</p>}
                    </div>
                  )}
                </div>

                {isUsedMachine && (
                  <div className="space-y-5 border-y border-gray-800 py-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Second-Hand Listing</h3>
                      <p className="mt-1 text-sm text-gray-500">Update offer terms and live machine availability.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available For</label>
                        <select name="availabilityType" value={formData.availabilityType} onChange={handleAvailabilityTypeChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:outline-none">
                          <option value="sale">Sale</option>
                          <option value="rent">Rent</option>
                          <option value="both">Sale and Rent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Availability Status</label>
                        <select name="availabilityStatus" value={formData.availabilityStatus} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:outline-none">
                          <option value="available">Available</option>
                          {includesRent && <option value="on_rent">On Rent</option>}
                          <option value="unavailable">Unavailable</option>
                          {includesSale && <option value="sold">Sold</option>}
                        </select>
                      </div>

                      {includesRent && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rental Price (₹)</label>
                            <input type="number" name="rentalPrice" min="0" step="0.01" value={formData.rentalPrice} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:outline-none" />
                            {formErrors.rentalPrice && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.rentalPrice}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rent Period</label>
                            <select name="rentPeriod" value={formData.rentPeriod} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:outline-none">
                              {rentPeriods.map((period) => (
                                <option key={period} value={period}>Per {period}</option>
                              ))}
                            </select>
                            {formErrors.rentPeriod && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.rentPeriod}</p>}
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Security Deposit (₹)</label>
                            <input type="number" name="securityDeposit" min="0" step="0.01" value={formData.securityDeposit} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:outline-none" />
                            {formErrors.securityDeposit && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.securityDeposit}</p>}
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Expected Available Date</label>
                        <input type="date" name="availableFrom" value={formData.availableFrom} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:outline-none" />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Availability Note</label>
                        <textarea name="availabilityNote" value={formData.availabilityNote} onChange={handleFormChange} rows="3" className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:border-amber-500 focus:outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                </div>

                {/* Images */}
                <div className="bg-[#1b2128] p-5 rounded-lg border border-gray-700">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Product Images</label>
                      <p className="text-xs text-gray-500 mt-1">
                        Uploading new images will replace the current image set.
                      </p>
                    </div>
                    {newImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewImages([])}
                        className="self-start sm:self-auto text-xs font-bold text-red-400 hover:text-red-300"
                      >
                        Clear Selected
                      </button>
                    )}
                  </div>
                  
                  {/* Display Old Images */}
                  {existingImages.length > 0 && newImages.length === 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Current Images</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {existingImages.map((img, i) => (
                          <img key={i} src={img.url} alt="existing" className="w-20 h-20 object-cover rounded border border-gray-600" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row mb-4">
                    <input type="file" accept="image/*" capture="environment" multiple onChange={handleImageChange} id="editCameraInput" style={{ display: 'none' }} />
                    <button type="button" onClick={() => document.getElementById('editCameraInput').click()} className="flex-1 rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-bold text-gray-300 transition hover:border-gray-500">
                      <span className="mr-2">📸</span> Take Photo
                    </button>

                    <input type="file" accept="image/*" multiple onChange={handleImageChange} id="editGalleryInput" style={{ display: 'none' }} />
                    <button type="button" onClick={() => document.getElementById('editGalleryInput').click()} className="flex-1 rounded-lg border border-blue-500/30 bg-blue-600/20 px-4 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-500">
                      <span className="mr-2">🖼</span> Upload from Gallery
                    </button>
                  </div>
                  
                  {/* Preview New Images */}
                  {newImages.length > 0 && (
                    <>
                    <p className="text-xs text-blue-400 font-bold mb-3">{newImages.length} replacement image{newImages.length === 1 ? '' : 's'} selected</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {newImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img src={URL.createObjectURL(img)} alt={`New Preview ${index+1}`} className="w-full h-24 object-cover rounded border border-blue-500/50" />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg"
                            aria-label={`Remove replacement image ${index + 1}`}
                          >
                            ×
                          </button>
                          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-800">
                  <button type="button" onClick={closeEditModal} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isUpdating} className={`px-8 py-3 ${isUpdating ? 'bg-blue-800 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold rounded-lg shadow-lg flex items-center`}>
                    {isUpdating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingProductId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1b2128] rounded-2xl border border-red-500/30 w-full max-w-sm p-8 text-center shadow-2xl transform scale-100 transition-all">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Delete Product?</h3>
            <p className="text-gray-400 text-sm mb-8">This action cannot be undone. All images and data associated with this product will be permanently removed.</p>
            
            <div className="flex space-x-3">
              <button 
                onClick={closeDeleteModal}
                className="flex-1 py-3 bg-[#0e1726] hover:bg-gray-800 border border-gray-700 text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className={`flex-1 py-3 ${isDeleting ? 'bg-red-800 cursor-not-allowed opacity-75' : 'bg-red-600 hover:bg-red-700'} text-white font-bold rounded-xl shadow-lg shadow-red-900/20 transition-all flex justify-center items-center`}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageProducts;
