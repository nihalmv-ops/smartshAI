import React from 'react';
import { ChevronRight } from 'lucide-react';

export const CategoryCard = ({ category, onSelectCategory }) => {
  return (
    <div
      onClick={() => onSelectCategory(category.id)}
      className={`group relative rounded-2xl p-4 bg-gradient-to-b ${category.bgGradient} border ${category.borderColor} shadow-xs hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden`}
    >
      {/* Category Image */}
      <div className="w-full h-28 flex items-center justify-center mb-3 overflow-hidden rounded-xl">
        <img
          src={category.image}
          alt={category.name}
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
          loading="lazy"
        />
      </div>

      {/* Content & Action Arrow */}
      <div className="flex items-center justify-between mt-1">
        <div>
          <h4 className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors">
            {category.name}
          </h4>
          <p className="text-[11px] font-medium text-slate-500">
            {category.itemCount}
          </p>
        </div>

        <div className="w-8 h-8 rounded-full bg-white shadow-xs group-hover:bg-brand-500 group-hover:text-white text-slate-500 flex items-center justify-center transition-all duration-300">
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};

