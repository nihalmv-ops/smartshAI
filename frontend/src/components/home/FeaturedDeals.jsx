import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, ArrowRight, Flame } from 'lucide-react';
import { productService } from '../../services/productService';
import { products as fallbackProducts } from '../../data/products';
import { ProductCard } from '../common/ProductCard';

export const FeaturedDeals = ({ onSelectProduct, onViewAll }) => {
  const [dealProducts, setDealProducts] = useState(() =>
    fallbackProducts.filter(p => p.featured).slice(0, 4)
  );

  useEffect(() => {
    productService.getAllProducts().then(res => {
      if (res && res.products && res.products.length > 0) {
        const feats = res.products.filter(p => p.featured).slice(0, 4);
        if (feats.length > 0) {
          setDealProducts(feats);
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <section className="py-14 supermart-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Deal Announcement Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-10 mb-10 shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white/5 skew-x-12 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Super Deal of the Day</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Up to 30% OFF on Fresh Farm Staples
              </h3>
              <p className="text-blue-100 text-sm max-w-lg">
                Stock your pantry with farm-fresh organic milk, premium basmati rice, eggs and healthy fruits today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
                <Clock className="w-5 h-5 text-amber-300 animate-pulse" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Ends in</p>
                  <p className="text-sm font-mono font-bold">04h : 28m : 15s</p>
                </div>
              </div>

              <button
                onClick={onViewAll}
                className="px-6 py-3 rounded-full bg-white text-brand-600 hover:bg-blue-50 font-bold text-sm shadow-md flex items-center gap-2 transition-transform active:scale-95"
              >
                <span>Shop Deals</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Featured Product Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Featured Highlights
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">Specially discounted daily essentials</p>
            </div>
            <button
              onClick={onViewAll}
              className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {dealProducts.map(prod => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

