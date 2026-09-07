import React, { useState, useEffect } from 'react';
import { ProductCard } from '../common/ProductCard';
import { productService } from '../../services/productService';
import { products as fallbackProducts } from '../../data/products';

export const PopularProducts = ({ onSelectProduct }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productList, setProductList] = useState(fallbackProducts);

  useEffect(() => {
    productService.getAllProducts({ sortBy: 'popular' }).then(res => {
      if (res && res.products && res.products.length > 0) {
        setProductList(res.products);
      }
    }).catch(() => {});
  }, []);

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'grocery', label: 'Grocery' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'snacks', label: 'Snacks' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'vegetables', label: 'Vegetables' }
  ];

  const popularList = productList.filter(p => {
    if (!p.popular) return false;
    if (selectedCategory === 'all') return true;
    return p.category && p.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <section className="py-14 supermart-hero border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Popular Products
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Check out our most loved products handpicked for everyday freshness
            </p>
          </div>

          {/* Filter Pills matching mockup */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const isActive = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
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

        {/* Product Cards Grid (6 on desktop, 3 on tablet, 2 on mobile matching mockup) */}
        {popularList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
            {popularList.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">No products found in this category.</p>
          </div>
        )}

      </div>
    </section>
  );
};

