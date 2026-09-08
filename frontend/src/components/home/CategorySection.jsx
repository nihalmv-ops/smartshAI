import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { categories as defaultCategories } from '../../data/categories';
import { CategoryCard } from '../common/CategoryCard';
import { productService } from '../../services/productService';

export const CategorySection = ({ onSelectCategory, onViewAll }) => {
  const [categoryList, setCategoryList] = useState(defaultCategories);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await productService.getCategories();
        if (data && data.length > 0) {
          setCategoryList(data);
        }
      } catch (err) {
        console.warn('Using local categories fallback:', err);
      }
    };
    loadCategories();
  }, []);

  return (
    <section className="py-10 sm:py-12 supermart-hero">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header Section matching mockup */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">
              Find what you need from our wide range of fresh categories
            </p>
          </div>

          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 group transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 6 Category Cards Grid: 2 on mobile, 3 on tablet, 6 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 lg:gap-5">
          {categoryList.map((cat) => (
            <CategoryCard
              key={cat._id || cat.slug || cat.id}
              category={cat}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

