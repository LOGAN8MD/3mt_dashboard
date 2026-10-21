import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';
import { CUSTOMER_ROLE, EMPLOYEE_ROLE } from '../utils/roles';
import {
  formatProductCurrency,
  formatProductDate,
  getAvailabilityBadgeClass,
  getConditionBadgeClass,
  getOfferBadgeClass,
  getProductAvailabilityLabel,
  getProductConditionLabel,
  getProductOfferLabel,
  getProductOfferSummary,
  isSecondHandProduct,
} from '../utils/productDisplay';

const LOW_STOCK_THRESHOLD = 5;

const getUniqueOptions = (products, field) => {
  const values = products
    .map((product) => product[field]?.trim())
    .filter(Boolean);

  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
};

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    totalCustomers: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    brand: '',
    stockStatus: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMessage('');

    const [
      productsResult,
      usersResult,
      pendingRequestsResult,
      approvedRequestsResult,
      rejectedRequestsResult,
    ] = await Promise.allSettled([
      axios.get('/api/products/inventory'),
      axios.get('/api/users'),
      axios.get('/api/pending-products/admin?status=pending'),
      axios.get('/api/pending-products/admin?status=approved'),
      axios.get('/api/pending-products/admin?status=rejected'),
    ]);

    if (productsResult.status === 'fulfilled') {
      setProducts(productsResult.value.data);
    } else {
      console.error(productsResult.reason);
      const message = productsResult.reason.response?.data?.message || 'Failed to load products';
      setErrorMessage(message);
      toast.error(message);
    }

    const hasMetricError = [
      usersResult,
      pendingRequestsResult,
      approvedRequestsResult,
      rejectedRequestsResult,
    ].some((result) => result.status === 'rejected');

    setDashboardStats({
      totalEmployees:
        usersResult.status === 'fulfilled'
          ? usersResult.value.data.filter((user) => user.role === EMPLOYEE_ROLE).length
          : 0,
      totalCustomers:
        usersResult.status === 'fulfilled'
          ? usersResult.value.data.filter((user) => user.role === CUSTOMER_ROLE).length
          : 0,
      pendingRequests:
        pendingRequestsResult.status === 'fulfilled' ? pendingRequestsResult.value.data.length : 0,
      approvedRequests:
        approvedRequestsResult.status === 'fulfilled' ? approvedRequestsResult.value.data.length : 0,
      rejectedRequests:
        rejectedRequestsResult.status === 'fulfilled' ? rejectedRequestsResult.value.data.length : 0,
    });

    if (hasMetricError) {
      toast.error('Some dashboard summary metrics could not be loaded');
    }

    setLoading(false);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const inventoryStats = useMemo(() => {
    const categories = new Set();

    return products.reduce(
      (stats, product) => {
        const stock = Number(product.stock) || 0;
        const category = product.category?.trim();

        if (category) {
          categories.add(category.toLowerCase());
        }

        return {
          totalProducts: stats.totalProducts + 1,
          inStock: stock > 0 ? stats.inStock + 1 : stats.inStock,
          lowStock:
            stock > 0 && stock <= LOW_STOCK_THRESHOLD
              ? stats.lowStock + 1
              : stats.lowStock,
          outOfStock: stock <= 0 ? stats.outOfStock + 1 : stats.outOfStock,
          totalCategories: categories.size,
        };
      },
      {
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        totalCategories: 0,
      }
    );
  }, [products]);

  const summaryCards = [
    {
      label: 'Total Products',
      value: inventoryStats.totalProducts,
      accent: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
    },
    {
      label: 'In Stock',
      value: inventoryStats.inStock,
      accent: 'border-green-500/40 bg-green-500/10 text-green-400',
    },
    {
      label: 'Low Stock',
      value: inventoryStats.lowStock,
      accent: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    },
    {
      label: 'Out of Stock',
      value: inventoryStats.outOfStock,
      accent: 'border-red-500/40 bg-red-500/10 text-red-400',
    },
    {
      label: 'Categories',
      value: inventoryStats.totalCategories,
      accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    },
    {
      label: 'Employees',
      value: dashboardStats.totalEmployees,
      accent: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
    },
    {
      label: 'Customers',
      value: dashboardStats.totalCustomers,
      accent: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    },
    {
      label: 'Pending Requests',
      value: dashboardStats.pendingRequests,
      accent: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
    },
    {
      label: 'Approved Requests',
      value: dashboardStats.approvedRequests,
      accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    {
      label: 'Rejected Requests',
      value: dashboardStats.rejectedRequests,
      accent: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    },
  ];

  const filterOptions = useMemo(
    () => ({
      categories: getUniqueOptions(products, 'category'),
      types: getUniqueOptions(products, 'type'),
      brands: getUniqueOptions(products, 'brand'),
    }),
    [products]
  );

  const handleFilterChange = (field, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: '',
      type: '',
      brand: '',
      stockStatus: '',
    });
  };

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(filters.category) ||
    Boolean(filters.type) ||
    Boolean(filters.brand) ||
    Boolean(filters.stockStatus);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const stock = Number(product.stock) || 0;
      const categoryMatches =
        !filters.category || product.category === filters.category;
      const typeMatches = !filters.type || product.type === filters.type;
      const brandMatches = !filters.brand || product.brand === filters.brand;
      const stockMatches =
        !filters.stockStatus ||
        (filters.stockStatus === 'inStock' && stock > 0) ||
        (filters.stockStatus === 'lowStock' &&
          stock > 0 &&
          stock <= LOW_STOCK_THRESHOLD) ||
        (filters.stockStatus === 'outOfStock' && stock <= 0);

      if (!categoryMatches || !typeMatches || !brandMatches || !stockMatches) {
        return false;
      }

      if (!normalizedSearchTerm) return true;

      const searchableFields = [
        product.name,
        product.brand,
        product.model,
        product.category,
        product.subCategory,
        product.type,
        product.size,
        product.description,
        product.condition,
        product.availabilityType,
        product.availabilityStatus,
      ];

      return searchableFields.some((field) =>
        String(field || '').toLowerCase().includes(normalizedSearchTerm)
      );
    });
  }, [filters, products, normalizedSearchTerm]);

  return (
    <AdminLayout>
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Overview</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4 mb-8">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-[#0e1726] rounded-xl shadow-lg border border-gray-800 p-5"
                >
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center mb-4 ${card.accent}`}>
                    <span className="text-sm font-black">{card.label.charAt(0)}</span>
                  </div>
                  <p className="text-xs uppercase tracking-widest font-bold text-gray-500">{card.label}</p>
                  <p className="text-3xl font-black text-white mt-2">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#0e1726] rounded-xl shadow-lg border border-gray-800 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-800 space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-wide">
                    All Products ({filteredProducts.length}/{products.length})
                  </h2>
                  <span className="text-sm text-gray-400">Click any row to view details</span>
                </div>

                <div className="relative w-full lg:w-80">
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full rounded-lg border border-gray-700 bg-[#1b2128] py-3 pl-10 pr-4 text-sm font-medium text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label="Search dashboard products"
                  />
                  <svg
                    className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                  </svg>
                </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label="Filter products by category"
                  >
                    <option value="">All Categories</option>
                    {filterOptions.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label="Filter products by type"
                  >
                    <option value="">All Types</option>
                    {filterOptions.types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label="Filter products by brand"
                  >
                    <option value="">All Brands</option>
                    {filterOptions.brands.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.stockStatus}
                    onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
                    className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    aria-label="Filter products by stock status"
                  >
                    <option value="">All Stock</option>
                    <option value="inStock">In Stock</option>
                    <option value="lowStock">Low Stock</option>
                    <option value="outOfStock">Out of Stock</option>
                  </select>

                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className={`rounded-lg border px-4 py-3 text-sm font-bold transition ${
                      hasActiveFilters
                        ? 'border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700'
                        : 'border-gray-800 bg-[#1b2128] text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 items-center animate-pulse">
                      <div className="h-14 w-14 rounded-md bg-gray-800"></div>
                      <div className="col-span-2 space-y-2">
                        <div className="h-4 w-48 max-w-full rounded bg-gray-800"></div>
                        <div className="h-3 w-28 rounded bg-gray-800"></div>
                      </div>
                      <div className="h-4 w-24 rounded bg-gray-800"></div>
                      <div className="h-9 w-32 rounded-lg bg-gray-800"></div>
                    </div>
                  ))}
                </div>
              ) : errorMessage ? (
                <div className="p-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                    <span className="text-xl font-black">!</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">Products could not be loaded</h3>
                  <p className="text-gray-400 text-sm mb-6">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={fetchProducts}
                    className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
                    <span className="text-xl font-black">+</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">No products yet</h3>
                  <p className="text-gray-400 text-sm mb-6">Start by adding the first product to your inventory.</p>
                  <Link
                    to="/admin/add-product"
                    className="inline-flex rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Add Product
                  </Link>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    <span className="text-xl font-black">0</span>
                  </div>
                  <h3 className="text-xl font-black text-white mb-2">No matching products</h3>
                  <p className="text-gray-400 text-sm mb-6">Adjust your search or clear filters to see more products.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg bg-gray-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-700"
                  >
                    Clear Search and Filters
                  </button>
                </div>
              ) : (
                <>
                <div className="divide-y divide-gray-800 md:hidden">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => openProductDetails(product)}
                      className="w-full p-4 text-left transition hover:bg-blue-600/10"
                    >
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
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${getConditionBadgeClass(product)}`}>
                              {getProductConditionLabel(product)}
                            </span>
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${getOfferBadgeClass(product)}`}>
                              {getProductOfferLabel(product)}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Category</span>
                              <span className="text-gray-300 break-words">{product.category || 'Uncategorized'}</span>
                            </div>
                            <div>
                              <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Offer</span>
                              <span className="font-bold text-blue-400">{getProductOfferSummary(product)}</span>
                            </div>
                          </div>
                          <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${isSecondHandProduct(product) ? getAvailabilityBadgeClass(product) : product.stock > 0 ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                            {isSecondHandProduct(product)
                              ? getProductAvailabilityLabel(product)
                              : product.stock > 0
                                ? `${product.stock} IN STOCK`
                                : 'OUT OF STOCK'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left border-collapse select-none">
                    <thead>
                      <tr className="bg-[#1b2128] text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                        <th className="px-6 py-4 font-bold">Image</th>
                        <th className="px-6 py-4 font-bold">Name</th>
                        <th className="px-6 py-4 font-bold">Category</th>
                        <th className="px-6 py-4 font-bold">Offer</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredProducts.map((product) => (
                        <tr 
                          key={product._id} 
                          onClick={() => openProductDetails(product)}
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
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${getConditionBadgeClass(product)}`}>
                                {getProductConditionLabel(product)}
                              </span>
                              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold uppercase ${getOfferBadgeClass(product)}`}>
                                {getProductOfferLabel(product)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400">{product.category || 'Uncategorized'}</td>
                          <td className="max-w-[260px] px-6 py-4 font-bold text-blue-400">{getProductOfferSummary(product)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${isSecondHandProduct(product) ? getAvailabilityBadgeClass(product) : product.stock > 0 ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                              {isSecondHandProduct(product)
                                ? getProductAvailabilityLabel(product)
                                : product.stock > 0
                                  ? `${product.stock} IN STOCK`
                                  : 'OUT OF STOCK'}
                            </span>
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
                  <button type="button" onClick={closeModal} aria-label="Close product details" className="text-gray-400 hover:text-white transition-colors text-2xl font-bold bg-transparent border-none cursor-pointer">×</button>
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
                           <div className="mt-3 flex flex-wrap gap-2">
                             <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${getConditionBadgeClass(selectedProduct)}`}>
                               {getProductConditionLabel(selectedProduct)}
                             </span>
                             <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${getOfferBadgeClass(selectedProduct)}`}>
                               {getProductOfferLabel(selectedProduct)}
                             </span>
                             <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${getAvailabilityBadgeClass(selectedProduct)}`}>
                               {getProductAvailabilityLabel(selectedProduct)}
                             </span>
                           </div>
                         </div>
                         
                         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                           {['sale', 'both'].includes(selectedProduct.availabilityType || 'sale') && (
                             <div className="rounded-lg border border-gray-800 bg-[#111b2b] p-3">
                               <span className="block text-xs font-bold uppercase text-gray-500">Sale Price</span>
                               <span className="mt-1 block text-xl font-bold text-blue-400">{formatProductCurrency(selectedProduct.price)}</span>
                             </div>
                           )}
                           {['rent', 'both'].includes(selectedProduct.availabilityType) && (
                             <div className="rounded-lg border border-gray-800 bg-[#111b2b] p-3">
                               <span className="block text-xs font-bold uppercase text-gray-500">Rental Price</span>
                               <span className="mt-1 block text-xl font-bold text-violet-300">
                                 {formatProductCurrency(selectedProduct.rentalPrice)} / {selectedProduct.rentPeriod || 'period'}
                               </span>
                             </div>
                           )}
                           {!isSecondHandProduct(selectedProduct) && (
                             <div className="sm:col-span-2">
                               <span className={`inline-flex rounded border px-3 py-1 text-xs font-bold uppercase ${selectedProduct.stock > 0 ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-red-500/20 bg-red-500/10 text-red-400'}`}>
                                 {selectedProduct.stock > 0 ? `${selectedProduct.stock} In Stock` : 'Out of Stock'}
                               </span>
                             </div>
                           )}
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
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Condition</span>
                                 <span className="text-gray-200">{getProductConditionLabel(selectedProduct)}</span>
                               </div>
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Offer Type</span>
                                 <span className="text-gray-200">{getProductOfferLabel(selectedProduct)}</span>
                               </div>
                               <div>
                                 <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Availability</span>
                                 <span className="text-gray-200">{getProductAvailabilityLabel(selectedProduct)}</span>
                               </div>
                               {['rent', 'both'].includes(selectedProduct.availabilityType) && (
                                 <div>
                                   <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Security Deposit</span>
                                   <span className="text-gray-200">{formatProductCurrency(selectedProduct.securityDeposit || 0)}</span>
                                 </div>
                               )}
                               {selectedProduct.availableFrom && (
                                 <div>
                                   <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Expected Available</span>
                                   <span className="text-gray-200">{formatProductDate(selectedProduct.availableFrom)}</span>
                                 </div>
                               )}
                            </div>
                         </div>

                         {selectedProduct.availabilityNote && (
                           <div className="space-y-2">
                             <span className="block text-gray-500 uppercase tracking-wider text-xs font-bold">Availability Note</span>
                             <div className="whitespace-pre-wrap rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-100">
                               {selectedProduct.availabilityNote}
                             </div>
                           </div>
                         )}
                         
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
          
    </AdminLayout>
  );
};

export default AdminDashboard;
