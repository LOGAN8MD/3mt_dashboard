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
import { useNavigate, Link } from 'react-router-dom';
import { showLoader, hideLoader } from '../utils/loaderState';

const AddProduct = () => {
  const [formData, setFormData] = useState({
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
  });

  const [images, setImages] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setImages([...images, ...Array.from(e.target.files)]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = new FormData();
    Object.keys(formData).forEach((key) => {
      productData.append(key, formData[key]);
    });

    images.forEach((img) => {
      productData.append('images', img);
    });

    try {
      setIsSubmitting(true);
      console.log(productData.getAll('images'));
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

  const handleLogout = () => {
    showLoader();
    setTimeout(() => {
      localStorage.removeItem('userInfo');
      toast.success('Logged out successfully');
      hideLoader();
      navigate('/login');
    }, 600);
  };

  return (
    <div className="flex h-screen bg-[#1b2128] font-sans text-gray-200 relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar - Left */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0e1726] shadow-xl flex flex-col transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out border-r border-gray-800`}>
        <div className="p-6 border-b border-gray-800 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-black text-blue-500 tracking-wider">3MT</h2>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Machine Tools</span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-4">
          <div className="text-xs uppercase text-gray-500 font-bold tracking-widest pl-3 mb-2">Menu</div>
          <Link to="/admin" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors border-l-4 border-transparent hover:border-gray-500">
             Dashboard
          </Link>
          <Link to="/admin/manage" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors border-l-4 border-transparent hover:border-gray-500">
            Manage Products
          </Link>
          <Link to="/admin/add-product" className="flex items-center px-4 py-3 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors border-l-4 border-blue-500">
            Add Product
          </Link>
          <Link to="/admin/orders" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors border-l-4 border-transparent hover:border-gray-500">
            View Orders
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0e1726] border-b border-gray-800 flex items-center justify-between px-4 lg:px-10 z-10 shadow-sm shrink-0">
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none mr-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-white text-xl font-black tracking-wider">3MT<span className="text-blue-500">TOOLS</span></div>
          </div>
          <div className="flex-1"></div> {/* Spacer */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400 hidden sm:block mr-2 border-r border-gray-700 pr-4">Admin User</div>
            <button 
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold tracking-wide transition-all shadow-sm"
            >
              LOGOUT
            </button>
          </div>
        </header>

        {/* Form Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#1b2128] p-6 lg:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Add New Product</h1>
            </div>

            <div className="bg-[#0e1726] rounded-xl shadow-lg border border-gray-800 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
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
                      <option value="machine">Machine</option>
                      <option value="part">Part</option>
                      <option value="tool">Tool</option>
                      <option value="accessory">Accessory</option>
                      <option value="spare">Spare</option>
                    </select>
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
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Product Images</label>
                  
                  <div className="flex space-x-4 mb-4">
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
                            onClick={() => setImages(images.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
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
        </main>
      </div>
    </div>
  );
};

export default AddProduct;

