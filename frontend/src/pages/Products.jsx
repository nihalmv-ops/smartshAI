import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Filter, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  X, 
  Star, 
  Check, 
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';
import { categories } from '../data/categories';
import { productService } from '../services/productService';
import { ProductCard } from '../components/common/ProductCard';

export const Products = ({ 
  navigateTo: propNavigateTo, 
  onSelectProduct: propOnSelectProduct, 
  initialCategory = 'all', 
  initialSearch = '' 
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlQuery = searchParams.get('search') || initialSearch || '';
  const urlCategory = searchParams.get('category') || initialCategory || 'all';

  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [maxPrice, setMaxPrice] = useState(300);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Synchronize when URL search params change
  useEffect(() => {
    const s = searchParams.get('search');
    const c = searchParams.get('category');
    if (s !== null) setSearchQuery(s);
    if (c !== null) setSelectedCategory(c);
  }, [searchParams]);

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const handleSearchInputChange = (val) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (!val) {
      newParams.delete('search');
    } else {
      newParams.set('search', val);
    }
    setSearchParams(newParams);
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productService.getAllProducts({
          search: searchQuery,
          category: selectedCategory,
          maxPrice,
          rating: minRating,
          inStock: inStockOnly ? 'true' : undefined,
          sortBy
        });
        if (isMounted && res && res.products) {
          setProducts(res.products);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchProducts();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, selectedCategory, maxPrice, minRating, inStockOnly, sortBy]);

  const filteredProducts = products;

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMaxPrice(300);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('popular');
    setSearchParams({});
  };

  const handleProductClick = (product) => {
    if (propOnSelectProduct) {
      propOnSelectProduct(product);
    }
    navigate(`/products/${product.id}`);
  };

  const hasActiveFilters = 
    selectedCategory !== 'all' || 
    searchQuery !== '' || 
    maxPrice < 300 || 
    minRating > 0 || 
    inStockOnly;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-5 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
            <button onClick={() => navigate('/')} className="hover:text-brand-600">Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-semibold capitalize">
              {selectedCategory === 'all' ? 'All Products' : selectedCategory}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
                {selectedCategory === 'all' ? 'All Supermarket Products' : `${selectedCategory} Collection`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Showing {filteredProducts.length} freshest grocery items delivered to your doorstep
              </p>
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters ({hasActiveFilters ? 'Active' : 'All'})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft sticky top-28 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-slate-900 text-sm">Filters</h3>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</h4>
              <div className="space-y-1">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Products</span>
                  {selectedCategory === 'all' && <Check className="w-4 h-4 text-brand-500" />}
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-50 text-brand-600 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-brand-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Price Slider */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Price Range</h4>
                <span className="text-xs font-bold text-slate-800">Up to ₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>₹20</span>
                <span>₹300+</span>
              </div>
            </div>

            {/* Minimum Rating */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Rating</h4>
              <div className="space-y-1.5">
                {[4.5, 4.0, 0].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900"
                  >
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="accent-brand-500"
                    />
                    <span>
                      {rating === 0 ? 'All Ratings' : `${rating} Stars & Above`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* In Stock Only */}
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded text-brand-500 focus:ring-brand-500 w-4 h-4 accent-brand-500"
                />
                <span>In Stock Only</span>
              </label>
            </div>

          </div>

          {/* Product Listing Area */}
          <div className="lg:col-span-3 space-y-5">
            
            {/* Search Bar on Products Page */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-soft flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400 pl-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                placeholder="Search products by name (e.g. Milk, Tomatoes, Lay's, Eggs)..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchInputChange('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Control Bar: View Switcher, Sort Dropdown & Filter Tags */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              {/* Active Filter Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs text-slate-700 font-medium">
                    Search: "{searchQuery}"
                    <button onClick={() => handleSearchInputChange('')} className="hover:text-slate-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-xs text-brand-700 font-bold">
                    Category: {selectedCategory}
                    <button onClick={() => handleCategorySelect('all')} className="hover:text-brand-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-xs text-amber-700 font-bold">
                    Rating: {minRating}★+
                    <button onClick={() => setMinRating(0)} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              {/* Sort By & View Toggle */}
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
                  >
                    <option value="popular">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>

                <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white shadow-xs text-brand-600' : 'text-slate-400'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white shadow-xs text-brand-600' : 'text-slate-400'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Product Grid / List */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5">
                {[1, 2, 3, 4, 5, 6].map((sk) => (
                  <div key={sk} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-soft animate-pulse space-y-3">
                    <div className="w-full h-44 bg-slate-100 rounded-2xl"></div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-5 w-16 bg-slate-200 rounded"></div>
                      <div className="h-8 w-20 bg-slate-200 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-5"
                  : "space-y-4"
              }>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product._id}
                    product={product}
                    onSelectProduct={handleProductClick}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-soft">
                <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No grocery items found</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  We couldn't find any products matching "{searchQuery}". Try changing or clearing filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-full text-xs font-bold shadow-md shadow-brand-500/20"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div 
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-xs bg-white h-full p-6 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Filter Products</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Categories</h4>
              <div className="space-y-1">
                <button
                  onClick={() => { handleCategorySelect('all'); setMobileFilterOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                    selectedCategory === 'all' ? 'bg-brand-50 text-brand-600' : 'text-slate-600'
                  }`}
                >
                  All Products
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { handleCategorySelect(cat.id); setMobileFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                      selectedCategory === cat.id ? 'bg-brand-50 text-brand-600' : 'text-slate-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price slider */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold">
                <span>Max Price</span>
                <span>₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 bg-brand-500 text-white rounded-xl font-bold text-sm shadow-md"
            >
              Apply Filters ({filteredProducts.length} items)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
