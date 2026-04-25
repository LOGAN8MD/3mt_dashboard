import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { showLoader, hideLoader } from '../utils/loaderState';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navigate = useNavigate();

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

  const handleLogout = () => {
    showLoader();
    setTimeout(() => {
      localStorage.removeItem('userInfo');
      toast.success('Logged out successfully');
      hideLoader();
      navigate('/login');
    }, 600);
  };

  const closeModal = () => {
    setSelectedProduct(null);
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
          <Link to="/admin" className="flex items-center px-4 py-3 bg-blue-600/10 text-blue-500 rounded-lg font-medium transition-colors border-l-4 border-blue-500">
             Dashboard
          </Link>
          <Link to="/admin/manage" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors border-l-4 border-transparent hover:border-gray-500">
            Manage Products
          </Link>
          <Link to="/admin/add-product" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors border-l-4 border-transparent hover:border-gray-500">
            Add Product
          </Link>
          {/* <Link to="/admin/orders" className="flex items-center px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors border-l-4 border-transparent hover:border-gray-500">
            View Orders
          </Link> */}
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

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#1b2128] p-6 lg:p-10 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
            </div>

            <div className="bg-[#0e1726] rounded-xl shadow-lg border border-gray-800 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white tracking-wide">All Products ({products.length})</h2>
                <span className="text-sm text-gray-400">Click any row to view details</span>
              </div>
              
              {loading ? (
                <div className="p-10 text-center text-gray-500">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="p-10 text-center text-gray-500 text-lg">No products found. Start by adding a new product.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="bg-[#1b2128] text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                        <th className="px-6 py-4 font-bold">Image</th>
                        <th className="px-6 py-4 font-bold">Name</th>
                        <th className="px-6 py-4 font-bold">Category</th>
                        <th className="px-6 py-4 font-bold">Price</th>
                        <th className="px-6 py-4 font-bold">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {products.map((product) => (
                        <tr 
                          key={product._id} 
                          onClick={() => {
                            setSelectedProduct(product);
                            setActiveImageIndex(0);
                          }}
                          className="hover:bg-blue-600/10 transition duration-150 cursor-pointer"
                        >
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
                          <td className="px-6 py-4 font-bold text-blue-400">₹{product.price}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${product.stock > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Detailed View Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
              <div 
                className="bg-[#0e1726] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1b2128] shrink-0">
                  <h3 className="text-xl font-bold text-white">Product Details</h3>
                  <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors text-2xl font-bold bg-transparent border-none cursor-pointer">×</button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
                   <div className="flex flex-col md:flex-row gap-8">
                      {/* Left: Images */}
                      <div className="w-full md:w-1/2 space-y-4">
                         {selectedProduct.images && selectedProduct.images.length > 0 ? (
                           <div className="space-y-4">
                             {/* Main Image */}
                             <img src={selectedProduct.images[activeImageIndex]?.url || selectedProduct.images[0].url} alt="Main Preview" className="w-full h-80 object-cover rounded-xl border border-gray-800 shadow-md transition-all duration-300" />
                             {/* Thumbnails */}
                             {selectedProduct.images.length > 1 && (
                               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                 {selectedProduct.images.map((img, idx) => (
                                   <img 
                                     key={idx} 
                                     src={img.url} 
                                     alt={`Preview ${idx+1}`} 
                                     onClick={() => setActiveImageIndex(idx)}
                                     className={`w-20 h-20 object-cover rounded-lg border cursor-pointer transition-all shrink-0 ${activeImageIndex === idx ? 'border-blue-500 ring-2 ring-blue-500 opacity-100' : 'border-gray-700 opacity-50 hover:opacity-100'}`} 
                                   />
                                 ))}
                               </div>
                             )}
                           </div>
                         ) : (
                           <div className="w-full h-80 bg-[#1b2128] rounded-xl border border-gray-800 flex items-center justify-center text-gray-500">
                             No Images Available
                           </div>
                         )}
                      </div>
                      
                      {/* Right: Details data */}
                      <div className="w-full md:w-1/2 space-y-5">
                         <div>
                           <h2 className="text-3xl font-black text-white">{selectedProduct.name}</h2>
                           {selectedProduct.brand && <span className="inline-block mt-2 px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold uppercase rounded-md">{selectedProduct.brand}</span>}
                         </div>
                         
                         <div className="flex items-center space-x-3">
                           <span className="text-2xl font-bold text-blue-500">₹{selectedProduct.price}</span>
                           <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${selectedProduct.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                             {selectedProduct.stock > 0 ? `${selectedProduct.stock} In Stock` : 'Out of Stock'}
                           </span>
                         </div>
                         
                         <div className="bg-[#1b2128] p-4 rounded-xl border border-gray-800 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Type</span>
                                 <span className="text-gray-200">{selectedProduct.type || '-'}</span>
                               </div>
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Category</span>
                                 <span className="text-gray-200">{selectedProduct.category || '-'}</span>
                               </div>
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Sub-Category</span>
                                 <span className="text-gray-200">{selectedProduct.subCategory || '-'}</span>
                               </div>
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Model</span>
                                 <span className="text-gray-200">{selectedProduct.model || '-'}</span>
                               </div>
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Size</span>
                                 <span className="text-gray-200">{selectedProduct.size || '-'}</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                           <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Description</span>
                           <div className="text-gray-300 text-sm bg-[#1b2128] p-4 border border-gray-800 rounded-xl leading-relaxed whitespace-pre-wrap">
                             {selectedProduct.description || 'No description provided.'}
                           </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
          
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;