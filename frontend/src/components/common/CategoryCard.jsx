import React from 'react';
import { ChevronRight } from 'lucide-react';

export const CategoryCard = ({ category, onSelectCategory }) => {
  return (
    <div
      onClick={() => onSelectCategory(category.slug || category.id)}
      className={`group relative rounded-xl sm:rounded-2xl p-2.5 sm:p-4 bg-gradient-to-b ${category.bgGradient} border ${category.borderColor} shadow-xs hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden`}
    >
      {/* Category Image */}
      <div className="w-full h-20 sm:h-28 flex items-center justify-center mb-2 sm:mb-3 overflow-hidden rounded-xl">
        <img
          src={category.image}
          alt={category.name}
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
          loading="lazy"
        />
      </div>

      {/* Content & Action Arrow */}
      <div className="flex items-center justify-between mt-1 gap-1">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-brand-600 transition-colors truncate">
            {category.name}
          </h4>
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500">
            {category.itemCount}
          </p>
        </div>

        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white shadow-xs group-hover:bg-brand-500 group-hover:text-white text-slate-500 flex items-center justify-center transition-all duration-300 shrink-0">
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};

