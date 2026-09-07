import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const Toast = () => {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-500 flex-shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-white/95 text-slate-800',
    error: 'border-rose-200 bg-white/95 text-slate-800',
    info: 'border-blue-200 bg-white/95 text-slate-800'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 ${
          borders[toastMessage.type] || borders.info
        }`}
      >
        {icons[toastMessage.type] || icons.info}
        <span className="text-sm font-medium">{toastMessage.msg}</span>
      </div>
    </div>
  );
};

