import React, { useState, useEffect } from 'react';
import { ProductCard } from '../common/ProductCard';
import { productService } from '../../services/productService';
import { Sparkles, ShoppingBag } from 'lucide-react';

export const PopularProducts = ({ onSelectProduct }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productList, setProductList] = useState([]);
  const [categoryTabs, setCategoryTabs] = useState([
    { id: 'all', label: 'All' },
    { id: 'grocery', label: 'Grocery' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'snacks', label: 'Snacks' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'vegetables', label: 'Vegetables' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      productService.getAllProducts({ sortBy: 'popular', limit: 36 }),
      productService.getCategories()
    ]).then(([prodRes, catRes]) => {
      if (!isMounted) return;

      if (prodRes.status === 'fulfilled' && prodRes.value?.products) {
        setProductList(prodRes.value.products);
      }

      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value) && catRes.value.length > 0) {
        const dynamicTabs = [
          { id: 'all', label: 'All' },
          ...catRes.value.map((c) => ({
            id: (c.slug || c.id || c.name).toLowerCase(),
            label: c.name
          }))
        ];
        // Deduplicate tabs
        const seen = new Set();
        const uniqueTabs = dynamicTabs.filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        });
        setCategoryTabs(uniqueTabs);
      }
    }).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products by selected category
  const filteredProducts = productList.filter((p) => {
    if (selectedCategory === 'all') return true;
    const cat = (p.category || '').toLowerCase().trim();
    const target = selectedCategory.toLowerCase().trim();
    return (
      cat === target ||
      cat.replace(/[^a-z0-9]/g, '') === target.replace(/[^a-z0-9]/g, '')
    );
  });

  // Prioritize popular products if marked, but show ALL admin products in that category!
  const displayList = [...filteredProducts].sort((a, b) => {
    const aPop = a.popular ? 1 : 0;
    const bPop = b.popular ? 1 : 0;
    return bPop - aPop;
  });

  return (
    <section className="py-10 sm:py-14 supermart-hero border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Direct From Store</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Products
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
              Check out our most loved products handpicked for everyday freshness
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {categoryTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-5 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm space-y-3">
                <div className="w-full h-32 bg-slate-100 rounded-xl" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-6 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : displayList.length > 0 ? (
          /* Real Admin Products Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-5">
            {displayList.map((product) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        ) : (
          /* Empty state when no products found */
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-slate-200 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No products in this category</h3>
            <p className="text-xs text-slate-500 mb-4">
              Products added by the admin will appear here automatically.
            </p>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 bg-brand-50 text-brand-600 hover:bg-brand-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                View All Products
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
