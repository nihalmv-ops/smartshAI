import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Phone, Check, X, CheckCircle2, Menu } from 'lucide-react';
import { whatsappService } from '../../services/whatsappService';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { useAdminLayout } from './AdminLayout';

export const AdminHeader = ({ title, subtitle, onRefresh, refreshing }) => {
  const layout = useAdminLayout();
  const [adminPhone, setAdminPhone] = useState(whatsappService.getAdminPhone());
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState(whatsappService.getAdminPhone());
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSavePhone = (e) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    const cleaned = whatsappService.cleanPhone(phoneInput);
    whatsappService.setAdminPhone(cleaned);
    setAdminPhone(cleaned);
    setPhoneModalOpen(false);
    showToast(`Store WhatsApp phone updated to +${cleaned}`);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Left: Mobile Hamburger & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
        {layout && (
          <button
            type="button"
            onClick={layout.toggleSidebar}
            className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-500 hidden sm:block mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* WhatsApp Store Config */}
        <button
          onClick={() => {
            setPhoneInput(adminPhone);
            setPhoneModalOpen(true);
          }}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Click to view or change store receiving WhatsApp number"
        >
          <WhatsAppIcon className="w-4 h-4 fill-[#25D366] shrink-0" />
          <span className="hidden md:inline">WhatsApp:</span>
          <span className="font-mono font-bold text-[11px] sm:text-xs">+{adminPhone}</span>
        </button>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 disabled:opacity-50 shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Phone Config Modal */}
      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn text-slate-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Admin WhatsApp Number</h3>
                  <p className="text-xs text-slate-500">Configure where customer orders are received</p>
                </div>
              </div>
              <button
                onClick={() => setPhoneModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Phone Number (with Country Code)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 919876543210 or 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter with country code (e.g. 91 for India). Standard 10-digit numbers will auto-prefix 91.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  How WhatsApp Order Alerts Work:
                </p>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  When a customer checks out on the storefront, their cart items, address, and total will be pre-formatted and sent directly to this WhatsApp number for instant confirmation!
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPhoneModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Phone Number</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default AdminHeader;

