// import React, { useState } from 'react';
// import axios from '../utils/axiosInstance';
// import { toast } from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';

// const AddProduct = () => {
//   const [name, setName] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [image, setImage] = useState(null);
//   const navigate = useNavigate();

//   const handleImageChange = (e) => {
//     setImage(e.target.files[0]);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append('name', name);
//     formData.append('description', description);
//     formData.append('price', price);
//     formData.append('image', image);

//     try {
//       await axios.post('/api/products', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       toast.success('Product added successfully!');
//       navigate('/admin');
//     } catch (error) {
//       toast.error('Failed to add product!');
//     }
//   };

//   return (
//     <div className="container mx-auto p-6 max-w-lg bg-white shadow-lg rounded-md">
//       <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label htmlFor="name" className="block text-sm font-semibold">Product Name</label>
//           <input
//             type="text"
//             id="name"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="description" className="block text-sm font-semibold">Description</label>
//           <textarea
//             id="description"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="price" className="block text-sm font-semibold">Price</label>
//           <input
//             type="number"
//             id="price"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             value={price}
//             onChange={(e) => setPrice(e.target.value)}
//             required
//           />
//         </div>

// {/*         <div className="mb-4">
//           <label htmlFor="image" className="block text-sm font-semibold">Product Image</label>
//           <input
//             type="file"
//             id="image"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             accept="image/*"
//              capture="environment"
//             onChange={handleImageChange}
//             required
//           />
//         </div> */}


//         <div className="mb-4">
//   <label className="block text-sm font-semibold mb-1">Product Image</label>

//   {/* 📸 Camera Button */}
//   <input
//     type="file"
//     accept="image/*"
//     capture="environment"
//     onChange={handleImageChange}
//     id="cameraInput"
//     style={{ display: 'none' }}
//   />
//   <button
//     type="button"
//     onClick={() => document.getElementById('cameraInput').click()}
//     className="w-full p-2 mb-2 bg-green-500 text-white rounded-md"
//   >
//     📸 Take Photo
//   </button>

//   {/* 🖼 Gallery/File Button */}
//   <input
//     type="file"
//     accept="image/*"
//     onChange={handleImageChange}
//     id="fileInput"
//     style={{ display: 'none' }}
//   />
//   <button
//     type="button"
//     onClick={() => document.getElementById('fileInput').click()}
//     className="w-full p-2 bg-blue-500 text-white rounded-md"
//   >
//     🖼 Upload from Gallery
//   </button>
// </div>



//         {image && (
//           <div className="mb-4">
//             <p className="text-sm font-semibold">Preview:</p>
//             <img
//               src={URL.createObjectURL(image)}
//               alt="Preview"
//               className="mt-2 w-full h-48 object-cover border rounded"
//             />
//           </div>
//         )}

//         <button
//           type="submit"
//           className="w-full p-2 bg-blue-500 text-white rounded-md"
//         >
//           Add Product
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddProduct;


import React, { useState } from 'react';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';

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

const AddProduct = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [images, setImages] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors((currentErrors) => ({ ...currentErrors, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setImages([...images, ...selectedFiles]);
    setFormErrors((currentErrors) => ({ ...currentErrors, images: '' }));
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(images.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    const productData = new FormData();
    Object.keys(formData).forEach((key) => {
      productData.append(key, formData[key]);
    });

    images.forEach((img) => {
      productData.append('images', img);
    });

    try {
      setIsSubmitting(true);
      await axios.post('/api/products', productData);
      toast.success('✅ Product added successfully!');
      navigate('/admin');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || '❌ Failed to add product!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Add New Product</h1>
              <p className="mt-2 text-sm text-gray-400">Create a complete inventory item with details, stock, and product images.</p>
            </div>

            <div className="bg-[#0e1726] rounded-xl shadow-lg border border-gray-800 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-gray-800 pb-4">
                  <h2 className="text-lg font-bold text-white">Product Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Core information shown in the dashboard and catalog.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                    {formErrors.name && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.name}</p>}
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    >
                      <option value="" className="text-gray-500">Select Type</option>
                      {productTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {formErrors.type && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.type}</p>}
                  </div>
                
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                    <input
                      type="text"
                      name="category"
                      placeholder="Category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                    {formErrors.category && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.category}</p>}
                  </div>

                  {/* Sub Category */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sub Category</label>
                    <input
                      type="text"
                      name="subCategory"
                      placeholder="Sub Category (optional)"
                      value={formData.subCategory}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      placeholder="Brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price (₹)</label>
                    <input
                      type="number"
                      name="price"
                      placeholder="Price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                    {formErrors.price && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.price}</p>}
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Size</label>
                    <input
                      type="text"
                      name="size"
                      placeholder="Size (e.g. 7 inch)"
                      value={formData.size}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Model</label>
                    <input
                      type="text"
                      name="model"
                      placeholder="Model (e.g. AG-7)"
                      value={formData.model}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stock Inventory</label>
                    <input
                      type="number"
                      name="stock"
                      placeholder="Stock quantity"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    {formErrors.stock && <p className="mt-2 text-xs font-bold text-red-400">{formErrors.stock}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    name="description"
                    placeholder="Provide a detailed description..."
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                {/* Image Upload */}
                <div className="bg-[#1b2128] p-5 rounded-lg border border-gray-700">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Product Images</label>
                      <p className="text-xs text-gray-500 mt-1">{images.length} selected. Maximum 5 images are accepted by the server.</p>
                    </div>
                    {images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setImages([])}
                        className="self-start sm:self-auto text-xs font-bold text-red-400 hover:text-red-300"
                      >
                        Clear Selected
                      </button>
                    )}
                  </div>
                  {formErrors.images && <p className="mb-3 text-xs font-bold text-red-400">{formErrors.images}</p>}
                  
                  <div className="flex flex-col gap-3 sm:flex-row mb-4">
                    {/* 📸 Camera */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleImageChange}
                      id="cameraInput"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('cameraInput').click()}
                      className="flex-1 py-3 bg-[#1b2128] border border-gray-700 hover:border-gray-500 text-gray-300 rounded-lg transition-colors font-medium flex justify-center items-center"
                    >
                      <span className="mr-2">📸</span> Take Photo
                    </button>

                    {/* 🖼 Gallery */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      id="fileInput"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('fileInput').click()}
                      className="flex-1 py-3 bg-blue-600/20 border border-blue-500/30 hover:border-blue-500 text-blue-400 rounded-lg transition-colors font-medium flex justify-center items-center"
                    >
                      <span className="mr-2">🖼</span> Upload Gallery
                    </button>
                  </div>

                  {/* Preview with Remove */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 p-4 bg-[#1b2128] rounded-lg border border-gray-800 border-dashed">
                      {images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md border border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                            aria-label={`Remove image ${index + 1}`}
                          >
                            ×
                          </button>
                          <div className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-6 border-t border-gray-800">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 ${isSubmitting ? 'bg-blue-800 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'} text-white font-bold rounded-lg tracking-wide shadow-lg shadow-blue-900/20 transition-all transform flex justify-center items-center`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ADDING PRODUCT...
                      </>
                    ) : (
                      "ADD PRODUCT"
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
    </AdminLayout>
  );
};

export default AddProduct;
