import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from '../utils/axiosInstance';
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

const UserDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    brand: '',
    stockStatus: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.get('/api/products/inventory');
      setProducts(response.data);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load products';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
          totalCategories: categories.size,
        };
      },
      {
        totalProducts: 0,
        inStock: 0,
        lowStock: 0,
        totalCategories: 0,
      }
    );
  }, [products]);

  const summaryCards = [
    {
      label: 'Available Products',
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
      label: 'Categories',
      value: inventoryStats.totalCategories,
      accent: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
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

  const closeModal = () => {
    setSelectedProduct(null);
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
    <>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Product Catalog</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-400">Browse approved inventory products and open any item for details.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-800 bg-[#0e1726] p-5 shadow-lg">
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg border ${card.accent}`}>
                <span className="text-sm font-black">{card.label.charAt(0)}</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{card.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#0e1726] shadow-lg">
          <div className="space-y-5 border-b border-gray-800 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-wide text-white">
                  Approved Products ({filteredProducts.length}/{products.length})
                </h2>
                <span className="text-sm text-gray-400">Click any product to view details</span>
              </div>

              <div className="relative w-full lg:w-80">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-lg border border-gray-700 bg-[#1b2128] py-3 pl-10 pr-4 text-sm font-medium text-white placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  aria-label="Search products"
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <select value={filters.category} onChange={(event) => handleFilterChange('category', event.target.value)} className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" aria-label="Filter products by category">
                <option value="">All Categories</option>
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select value={filters.type} onChange={(event) => handleFilterChange('type', event.target.value)} className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" aria-label="Filter products by type">
                <option value="">All Types</option>
                {filterOptions.types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select value={filters.brand} onChange={(event) => handleFilterChange('brand', event.target.value)} className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" aria-label="Filter products by brand">
                <option value="">All Brands</option>
                {filterOptions.brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              <select value={filters.stockStatus} onChange={(event) => handleFilterChange('stockStatus', event.target.value)} className="rounded-lg border border-gray-700 bg-[#1b2128] px-3 py-3 text-sm font-medium text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500" aria-label="Filter products by stock status">
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
                    : 'cursor-not-allowed border-gray-800 bg-[#1b2128] text-gray-600'
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-lg bg-[#1b2128]" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400">
                <span className="text-xl font-black">!</span>
              </div>
              <h3 className="mb-2 text-xl font-black text-white">Products could not be loaded</h3>
              <p className="mb-6 text-sm text-gray-400">{errorMessage}</p>
              <button type="button" onClick={fetchProducts} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400">
                <span className="text-xl font-black">0</span>
              </div>
              <h3 className="mb-2 text-xl font-black text-white">No approved products yet</h3>
              <p className="text-sm text-gray-400">Approved products will appear here after admin review.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <span className="text-xl font-black">0</span>
              </div>
              <h3 className="mb-2 text-xl font-black text-white">No matching products</h3>
              <p className="mb-6 text-sm text-gray-400">Adjust your search or clear filters to see more products.</p>
              <button type="button" onClick={clearFilters} className="rounded-lg bg-gray-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-gray-700">
                Clear Search and Filters
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-800 md:hidden">
                {filteredProducts.map((product) => (
                  <button key={product._id} type="button" onClick={() => openProductDetails(product)} className="w-full p-4 text-left transition hover:bg-blue-600/10">
                    <div className="flex gap-4">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0].url} alt={product.name} className="h-20 w-20 shrink-0 rounded-md border border-gray-700 object-cover shadow-sm" />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-gray-800 text-xs font-semibold text-gray-500">No IMG</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="break-words font-bold text-gray-100">{product.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{product.brand || 'No Brand'}</div>
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
                            <span className="break-words text-gray-300">{product.category || 'Uncategorized'}</span>
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
                <table className="w-full select-none border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-700 bg-[#1b2128] text-xs uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-4 font-bold">Image</th>
                      <th className="px-6 py-4 font-bold">Name</th>
                      <th className="px-6 py-4 font-bold">Category</th>
                      <th className="px-6 py-4 font-bold">Offer</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredProducts.map((product) => (
                      <tr key={product._id} onClick={() => openProductDetails(product)} className="cursor-pointer transition duration-150 hover:bg-blue-600/10">
                        <td className="px-6 py-4">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0].url} alt={product.name} className="h-14 w-14 rounded-md border border-gray-700 object-cover shadow-sm" />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-800 text-xs font-semibold text-gray-500">No IMG</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-100">{product.name}</div>
                          <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{product.brand || 'No Brand'}</div>
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

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={closeModal}>
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-[#0e1726] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-[#1b2128] px-6 py-4">
              <h3 className="text-xl font-bold text-white">Product Details</h3>
              <button type="button" onClick={closeModal} aria-label="Close product details" className="border-none bg-transparent text-2xl font-bold text-gray-400 transition-colors hover:text-white">×</button>
            </div>
            <div className="overflow-y-auto p-6 md:p-8">
              <div className="flex flex-col gap-8 md:flex-row">
                <div className="w-full space-y-4 md:w-1/2">
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <div className="space-y-4">
                      <img src={selectedProduct.images[activeImageIndex]?.url || selectedProduct.images[0].url} alt={selectedProduct.name} className="h-80 w-full rounded-xl border border-gray-800 object-cover shadow-md transition-all duration-300" />
                      {selectedProduct.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {selectedProduct.images.map((image, index) => (
                            <button key={image.public_id || image.url} type="button" onClick={() => setActiveImageIndex(index)} className="shrink-0">
                              <img src={image.url} alt={`${selectedProduct.name} ${index + 1}`} className={`h-20 w-20 rounded-lg border object-cover transition-all ${activeImageIndex === index ? 'border-blue-500 opacity-100 ring-2 ring-blue-500' : 'border-gray-700 opacity-50 hover:opacity-100'}`} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-80 w-full items-center justify-center rounded-xl border border-gray-800 bg-[#1b2128] text-gray-500">
                      No Images Available
                    </div>
                  )}
                </div>
                <div className="w-full space-y-5 md:w-1/2">
                  <div>
                    <h2 className="text-3xl font-black text-white">{selectedProduct.name}</h2>
                    {selectedProduct.brand && <span className="mt-2 inline-block rounded-md bg-gray-800 px-3 py-1 text-xs font-bold uppercase text-gray-300">{selectedProduct.brand}</span>}
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
                  <div className="space-y-3 rounded-xl border border-gray-800 bg-[#1b2128] p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        ['Type', selectedProduct.type],
                        ['Category', selectedProduct.category],
                        ['Sub-Category', selectedProduct.subCategory],
                        ['Model', selectedProduct.model],
                        ['Size', selectedProduct.size],
                        ['Condition', getProductConditionLabel(selectedProduct)],
                        ['Offer Type', getProductOfferLabel(selectedProduct)],
                        ['Availability', getProductAvailabilityLabel(selectedProduct)],
                        ...(selectedProduct.availableFrom
                          ? [['Expected Available', formatProductDate(selectedProduct.availableFrom)]]
                          : []),
                        ...(['rent', 'both'].includes(selectedProduct.availabilityType)
                          ? [['Security Deposit', formatProductCurrency(selectedProduct.securityDeposit || 0)]]
                          : []),
                      ].map(([label, value]) => (
                        <div key={label}>
                          <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
                          <span className="text-gray-200">{value || '-'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedProduct.availabilityNote && (
                    <div className="space-y-2">
                      <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Availability Note</span>
                      <div className="whitespace-pre-wrap rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-100">
                        {selectedProduct.availabilityNote}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Description</span>
                    <div className="whitespace-pre-wrap rounded-xl border border-gray-800 bg-[#1b2128] p-4 text-sm leading-relaxed text-gray-300">
                      {selectedProduct.description || 'No description provided.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDashboard;
