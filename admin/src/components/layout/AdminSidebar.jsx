import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Landmark,
  FileText,
  LineChart,
  Sparkles,
  Package,
  Layers,
  MessageSquare,
  Users,
  ShieldCheck,
  ExternalLink,
  LogOut,
  X
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAdminAuth();
  const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173';

  const navGroups = [
    {
      title: 'Store Operations',
      items: [
        { to: '/', label: 'Overview', icon: LayoutDashboard },
        { to: '/pos', label: 'Offline Counter POS', icon: Store, badge: 'Counter' },
        { to: '/orders', label: 'Orders & WhatsApp', icon: ShoppingBag }
      ]
    },
    {
      title: 'Finance & Accounts',
      items: [
        { to: '/sales', label: 'Sales & Revenue', icon: TrendingUp },
        { to: '/expenses', label: 'Operating Expenses', icon: Receipt },
        { to: '/register', label: 'Daily Cash Drawer', icon: Landmark },
        { to: '/reports', label: 'Reports & Statements', icon: FileText }
      ]
    },
    {
      title: 'Growth & Intelligence',
      items: [
        { to: '/growth', label: 'Business Growth', icon: LineChart },
        { to: '/analytics', label: 'AI Analytics', icon: Sparkles }
      ]
    },
    {
      title: 'Catalog & System',
      items: [
        { to: '/products', label: 'Products & Costing', icon: Package },
        { to: '/categories', label: 'Categories', icon: Layers },
        { to: '/whatsapp-settings', label: 'WhatsApp Contacts', icon: MessageSquare },
        { to: '/users', label: 'Users & Staff', icon: Users }
      ]
    }
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
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/20 font-black">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                Skyline Mart <span className="text-emerald-400 font-bold">Admin</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Business Management System</p>
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

        {/* Navigation Groups */}
        <nav className="p-3.5 space-y-4 flex-1 overflow-y-auto">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {group.title}
              </p>
              {group.items.map((item) => {
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
                      `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom User & Actions Section */}
        <div className="p-3.5 border-t border-slate-800 space-y-2.5 bg-slate-950/40">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/60 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Open Storefront</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black flex items-center justify-center text-xs shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@skylinemart.com'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
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
