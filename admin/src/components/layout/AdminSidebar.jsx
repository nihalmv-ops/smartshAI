import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  LogOut,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAdminAuth();
  const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173';

  const navItems = [
    { to: '/', label: 'Overview', icon: TrendingUp },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/categories', label: 'Categories', icon: Layers },
    { to: '/orders', label: 'Orders & WhatsApp', icon: ShoppingBag },
    { to: '/users', label: 'Users & Staff', icon: Users },
    { to: '/analytics', label: 'AI Analytics', icon: Sparkles },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Container: Fixed slide-in drawer on mobile (<lg), static sidebar on desktop (lg:) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 lg:w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col shrink-0 min-h-screen transition-transform duration-300 lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-5 sm:px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                Skyline Mart <span className="text-brand-400">Admin</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Control Center</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Management
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

      {/* Bottom User & Actions Section */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>View Customer Site</span>
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/40 text-brand-300 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@smartmart.ai'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default AdminSidebar;

