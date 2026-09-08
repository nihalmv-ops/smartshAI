import React from 'react';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { categories } from '../data/categories';
import { products } from '../data/products';

export const Categories = ({ navigateTo }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-4">
          <button onClick={() => navigateTo('home')} className="hover:text-brand-600">Home</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-semibold">Categories</span>
        </div>

        {/* Page Title */}
        <div className="mb-8 sm:mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Smart Categories</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore All Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Find everything your home needs—from morning dairy and daily farm greens to evening snacks and beverages.
          </p>
        </div>

        {/* Categories Big Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const catProducts = products.filter(p => p.category.toLowerCase() === cat.id.toLowerCase());
            return (
              <div
                key={cat.id}
                onClick={() => navigateTo('products', { category: cat.id })}
                className={`group rounded-3xl p-4 sm:p-6 bg-gradient-to-br ${cat.bgGradient} border ${cat.borderColor} shadow-soft hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="px-2.5 sm:px-3 py-1 bg-white/80 backdrop-blur-xs text-slate-700 rounded-full text-xs font-bold shadow-xs">
                      {cat.itemCount}
                    </span>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white text-slate-600 group-hover:bg-brand-500 group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>

                  <div className="w-full h-32 sm:h-40 flex items-center justify-center my-3 sm:my-4 overflow-hidden">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-500"
                    />
                  </div>

                  <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                {/* Micro preview of popular items */}
                <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between">
                  <div className="flex -space-x-2 overflow-hidden">
                    {catProducts.slice(0, 3).map((item) => (
                      <img
                        key={item.id}
                        src={item.image}
                        alt={item.name}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover bg-white"
                        title={item.name}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-brand-600 group-hover:underline flex items-center gap-1">
                    Explore items <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

