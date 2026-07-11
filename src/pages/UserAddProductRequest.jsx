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
};

const productTypes = ['machine', 'accessory', 'part', 'tool', 'spare'];

const UserAddProductRequest = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [fieldOptions, setFieldOptions] = useState({ categories: [], brands: [] });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
    if (!formData.price || Number(formData.price) < 0) errors.price = 'Enter a valid price.';
    if (formData.stock && Number(formData.stock) < 0) errors.stock = 'Stock cannot be negative.';
    if (images.length === 0) errors.images = 'Add at least one product image.';

    return errors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
    setFormErrors((currentErrors) => ({ ...currentErrors, [name]: '' }));
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
    Object.entries(formData).forEach(([key, value]) => {
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

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-400">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] p-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Price"
                  min="0"
                  required
                />
                {formErrors.price && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.price}</p>}
              </div>

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
