import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import axios from '../utils/axiosInstance';

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

const productTypes = ['machine', 'accessory', 'part', 'tool', 'spare'];
const rentPeriods = ['day', 'week', 'month'];

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

const UserAddProductRequest = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [fieldOptions, setFieldOptions] = useState({ categories: [], brands: [] });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const isUsedMachine = formData.type === 'machine' && formData.condition === 'used';
  const includesSale = !isUsedMachine || ['sale', 'both'].includes(formData.availabilityType);
  const includesRent = isUsedMachine && ['rent', 'both'].includes(formData.availabilityType);

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
    if (images.length === 0) errors.images = 'Add at least one product image.';

    return errors;
  };

  const handleChange = (event) => {
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

    setFormData((currentData) => ({
      ...currentData,
      availabilityType,
      rentPeriod:
        ['rent', 'both'].includes(availabilityType) && !currentData.rentPeriod
          ? 'month'
          : currentData.rentPeriod,
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      price: '',
      rentalPrice: '',
      rentPeriod: '',
    }));
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setImages((currentImages) => [...currentImages, ...selectedFiles].slice(0, 5));
    setFormErrors((currentErrors) => ({ ...currentErrors, images: '' }));
    event.target.value = '';
  };

  const removeImage = (index) => {
    setImages((currentImages) => currentImages.filter((_, imageIndex) => imageIndex !== index));
  };

  const clearImages = () => {
    setImages([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const requestData = new FormData();
    const submissionData = isUsedMachine
      ? {
          ...formData,
          price: includesSale ? formData.price : '',
          rentalPrice: includesRent ? formData.rentalPrice : '',
          rentPeriod: includesRent ? formData.rentPeriod : '',
          securityDeposit: includesRent ? formData.securityDeposit : '',
          availabilityStatus: 'available',
          stock: '1',
        }
      : { ...formData, ...defaultListingFields };

    Object.entries(submissionData).forEach(([key, value]) => {
      requestData.append(key, value);
    });

    images.forEach((image) => {
      requestData.append('images', image);
    });

    setIsSubmitting(true);

    try {
      await axios.post('/api/pending-products', requestData);
      toast.success('Product request sent for admin review');
      setFormData(initialFormData);
      setImages([]);
      navigate('/user');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit product request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Approval Request</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Add Product Request</h1>
          <p className="mt-2 text-sm text-gray-400">Submit a new product for admin review. It will appear in inventory only after approval.</p>
        </div>

        <div className="rounded-xl border border-gray-800 bg-[#0e1726] p-6 shadow-lg md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-white">Product Details</h2>
              <p className="mt-1 text-sm text-gray-500">Add complete information so admin can approve it faster.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter product name"
                  required
                />
                {formErrors.name && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Type</option>
                  {productTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formErrors.type && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.type}</p>}
              </div>

              {formData.type === 'machine' && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Machine Condition</label>
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
                      <span className="mt-1 block text-xs text-gray-400">Submit a standard machine for sale.</span>
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
                      <span className="mt-1 block text-xs text-gray-400">Submit it for sale, rent, or both.</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                <input
                  type="text"
                  name="category"
                  list="userRequestCategoryOptions"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Category"
                  required
                />
                <datalist id="userRequestCategoryOptions">
                  {fieldOptions.categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
                {formErrors.category && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.category}</p>}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Sub Category</label>
                <input
                  type="text"
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Brand</label>
                <input
                  type="text"
                  name="brand"
                  list="userRequestBrandOptions"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Brand"
                />
                <datalist id="userRequestBrandOptions">
                  {fieldOptions.brands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
              </div>

              {includesSale && (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">
                    {isUsedMachine ? 'Sale Price (₹)' : 'Price (₹)'}
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={isUsedMachine ? 'Second-hand sale price' : 'Price'}
                    min="0"
                    step="0.01"
                    required
                  />
                  {formErrors.price && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.price}</p>}
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Size</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Size"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Model"
                />
              </div>

              {!isUsedMachine && (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Stock"
                    min="0"
                  />
                  {formErrors.stock && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.stock}</p>}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Describe the product"
                />
              </div>
            </div>

            {isUsedMachine && (
              <div className="space-y-5 border-y border-gray-800 py-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Second-Hand Listing</h2>
                  <p className="mt-1 text-sm text-gray-500">Provide the sale or rental terms for admin review.</p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Available For</label>
                    <select
                      name="availabilityType"
                      value={formData.availabilityType}
                      onChange={handleAvailabilityTypeChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="sale">Sale</option>
                      <option value="rent">Rent</option>
                      <option value="both">Sale and Rent</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Initial Availability</label>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">
                      Available
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Admin can update this status during review.</p>
                  </div>

                  {includesRent && (
                    <>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Rental Price (₹)</label>
                        <input
                          type="number"
                          name="rentalPrice"
                          value={formData.rentalPrice}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="Rental price"
                          min="0"
                          step="0.01"
                          required
                        />
                        {formErrors.rentalPrice && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.rentalPrice}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Rent Period</label>
                        <select
                          name="rentPeriod"
                          value={formData.rentPeriod}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          required
                        >
                          {rentPeriods.map((period) => (
                            <option key={period} value={period}>Per {period}</option>
                          ))}
                        </select>
                        {formErrors.rentPeriod && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.rentPeriod}</p>}
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Security Deposit (₹)</label>
                        <input
                          type="number"
                          name="securityDeposit"
                          value={formData.securityDeposit}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          placeholder="Optional security deposit"
                          min="0"
                          step="0.01"
                        />
                        {formErrors.securityDeposit && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.securityDeposit}</p>}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Expected Available Date</label>
                    <input
                      type="date"
                      name="availableFrom"
                      value={formData.availableFrom}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Availability Note</label>
                    <textarea
                      name="availabilityNote"
                      value={formData.availabilityNote}
                      onChange={handleChange}
                      rows="3"
                      className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      placeholder="Optional availability or rental note"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-800 bg-[#111b2b] p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Product Images</h3>
                  <p className="mt-1 text-sm text-gray-500">Upload up to 5 images for admin review.</p>
                </div>
                {images.length > 0 && (
                  <button
                    type="button"
                    onClick={clearImages}
                    className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                  >
                    Clear Images
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleImageChange}
                  id="userRequestCameraInput"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('userRequestCameraInput').click()}
                  className="flex-1 rounded-lg border border-gray-700 bg-[#1b2128] px-4 py-3 text-sm font-bold text-gray-300 transition hover:border-gray-500"
                >
                  <span className="mr-2">📸</span> Take Photo
                </button>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  id="userRequestGalleryInput"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('userRequestGalleryInput').click()}
                  className="flex-1 rounded-lg border border-blue-500/30 bg-blue-600/20 px-4 py-3 text-sm font-bold text-blue-300 transition hover:border-blue-500"
                >
                  <span className="mr-2">🖼</span> Upload from Gallery
                </button>
              </div>
              {formErrors.images && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.images}</p>}

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {images.map((image, index) => (
                    <div key={`${image.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-[#1b2128] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-200">{image.name}</p>
                        <p className="text-xs text-gray-500">{Math.ceil(image.size / 1024)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="shrink-0 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 px-5 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit for Admin Review'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserAddProductRequest;
