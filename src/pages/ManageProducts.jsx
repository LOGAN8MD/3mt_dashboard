import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { showLoader, hideLoader } from '../utils/loaderState';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal States
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form State for Editing
  const [formData, setFormData] = useState({
    name: '', type: '', category: '', subCategory: '',
    brand: '', description: '', size: '', model: '',
    price: '', stock: ''
  });
  const [newImages, setNewImages] = useState([]); // File objects for new images
  const [existingImages, setExistingImages] = useState([]); // URLs for display

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
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
      price: product.price || '',
      stock: product.stock || ''
    });
    setExistingImages(product.images || []);
    setNewImages([]);
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setFormData({});
    setNewImages([]);
    setExistingImages([]);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    // When new images are selected, we override or append depending on requirements.
    // For now, if they select new images, it will overwrite the old ones on backend.
    setNewImages([...newImages, ...Array.from(e.target.files)]);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const productData = new FormData();
    Object.keys(formData).forEach((key) => {
      productData.append(key, formData[key]);
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
          <Link to="/admin/manage" className="flex items-center px-4 py-3 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors border-l-4 border-blue-500">
            Manage Products
          </Link>
          <Link to="/admin/add-product" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors border-l-4 border-transparent hover:border-gray-500">
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
          <div className="flex-1"></div>
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

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#1b2128] p-6 lg:p-10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Manage Inventory</h1>
            </div>

            <div className="bg-[#0e1726] rounded-xl shadow-lg border border-gray-800 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white tracking-wide">Update & Delete Products</h2>
              </div>
              
              {loading ? (
                <div className="p-10 text-center text-gray-500">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-lg">No products found. Start by adding a new product.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#1b2128] text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                        <th className="px-6 py-4 font-bold">Image</th>
                        <th className="px-6 py-4 font-bold">Name</th>
                        <th className="px-6 py-4 font-bold">Category</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {products.map((product) => (
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
              )}
            </div>
          </div>
        </main>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1726] rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1b2128]">
              <h2 className="text-xl font-bold text-white tracking-wide">Edit Product</h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleUpdateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                  </div>
                  {/* Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Type</label>
                    <select name="type" value={formData.type} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white">
                      <option value="">Select Type</option>
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
                    <input type="text" name="category" value={formData.category} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
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
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Price (₹)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleFormChange} required className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                  </div>
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
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stock Inventory</label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleFormChange} className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleFormChange} rows="3" className="w-full p-3 bg-[#1b2128] border border-gray-700 rounded-lg text-white" />
                </div>

                {/* Images */}
                <div className="bg-[#1b2128] p-5 rounded-lg border border-gray-700">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Product Images</label>
                  
                  {/* Display Old Images */}
                  {existingImages.length > 0 && newImages.length === 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2">Current Images (Will be replaced if new ones are uploaded)</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {existingImages.map((img, i) => (
                          <img key={i} src={img.url} alt="existing" className="w-20 h-20 object-cover rounded border border-gray-600" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 mb-4">
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} id="editFileInput" style={{ display: 'none' }} />
                    <button type="button" onClick={() => document.getElementById('editFileInput').click()} className="py-2 px-4 bg-blue-600/20 border border-blue-500/30 hover:border-blue-500 text-blue-400 rounded-lg transition-colors font-medium">
                      Upload New Images
                    </button>
                    {newImages.length > 0 && (
                       <button type="button" onClick={() => setNewImages([])} className="py-2 px-4 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:border-red-500 transition-colors">
                         Clear Selected
                       </button>
                    )}
                  </div>
                  
                  {/* Preview New Images */}
                  {newImages.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {newImages.map((img, index) => (
                        <div key={index} className="relative">
                          <img src={URL.createObjectURL(img)} alt={`New Preview ${index+1}`} className="w-full h-24 object-cover rounded border border-blue-500/50" />
                          <button type="button" onClick={() => setNewImages(newImages.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                        </div>
                      ))}
                    </div>
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
    </div>
  );
};

export default ManageProducts;
