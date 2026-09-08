import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  Search,
  CheckCircle2,
  Loader2,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { AdminHeader } from '../components/layout/AdminHeader';

export const AIAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({
    aiAnalytics: {
      lowStockProducts: [],
      mostRecommended: [],
      popularSearches: []
    }
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await adminService.getDashboardStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load AI analytics', 'error');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleQuickRestock = async (productId) => {
    try {
      await adminService.updateStock(productId, {
        stockCount: 50,
        inStock: true
      });
      showToast('Product successfully restocked +50 units!');
      await fetchAnalytics();
    } catch (err) {
      showToast(err.message || 'Restock action failed', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Analyzing store intelligence...</p>
      </div>
    );
  }

  const lowStock = stats.aiAnalytics?.lowStockProducts || [];
  const recommended = stats.aiAnalytics?.mostRecommended || [];
  const searches = stats.aiAnalytics?.popularSearches || [];

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="AI Inventory &amp; Demand Analytics"
        subtitle="Automated inventory forecasting, product affinities, and customer demand trends"
        onRefresh={fetchAnalytics}
        refreshing={refreshing}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast.msg}</span>
        </div>
      )}

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Low Stock Alerts & Quick Restock Section */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Low Stock Inventory Alerts</h3>
                <p className="text-xs text-slate-500">Products requiring immediate restock action</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {lowStock.length} Items Alerting
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {lowStock.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <PackageCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-700">All products are adequately stocked!</p>
                <p className="text-xs text-slate-400 mt-0.5">No immediate restock thresholds violated.</p>
              </div>
            ) : (
              lowStock.map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-xl border border-amber-200 bg-white shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.unit} • ₹{item.price}</p>
                      <p className="text-xs font-extrabold text-rose-600 mt-1">
                        Only {item.stockCount} left in stock
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickRestock(item._id)}
                    className="mt-3.5 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Quick Restock (+50 Units)
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Recommended Products & Trending Searches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Recommended Products */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">AI Top Recommended Products</h3>
                <p className="text-xs text-slate-500">Highest sales velocity and positive customer rating</p>
              </div>
            </div>

            <div className="space-y-3">
              {recommended.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No recommendations computed yet</p>
              ) : (
                recommended.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-extrabold text-slate-400">
                        #{idx + 1}
                      </span>
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-100 bg-slate-50 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500">{p.unit} • ₹{p.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        ★ {p.rating}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.stockCount} in stock</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Popular Customer Searches */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Trending Customer Searches</h3>
                <p className="text-xs text-slate-500">Frequently searched keywords and demand queries</p>
              </div>
            </div>

            <div className="space-y-3">
              {searches.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No search query trends yet</p>
              ) : (
                searches.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">"{s.tag}"</p>
                        <span className="text-[10px] font-semibold text-brand-600 uppercase">
                          {s.category}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700">{s.count} searches</span>
                      <p className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                        <TrendingUp className="w-3 h-3" />
                        <span>{s.growth}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAnalytics;

