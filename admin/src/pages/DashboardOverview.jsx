import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { AdminHeader } from '../components/layout/AdminHeader';

export const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    summary: {
      totalUsers: 0,
      totalProducts: 0,
      inStockProducts: 0,
      outOfStockProducts: 0,
      totalOrders: 0,
      totalRevenue: 0
    },
    orderStatuses: {},
    salesTrend: [],
    recentOrders: [],
    aiAnalytics: {
      lowStockProducts: [],
      mostRecommended: [],
      popularSearches: []
    }
  });

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await adminService.getDashboardStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading SmartMart Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Dashboard Overview"
        subtitle="Real-time store performance, revenue, orders & stock metrics"
        onRefresh={fetchStats}
        refreshing={refreshing}
      />

      <main className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
        {/* Urgent Low Stock Banner */}
        {stats.aiAnalytics.lowStockProducts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Inventory Alert: {stats.aiAnalytics.lowStockProducts.length} Products Low in Stock!
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Some items are under safety threshold (≤10 units). Immediate restock recommended.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs self-stretch sm:self-auto cursor-pointer"
            >
              View Restock Alerts
            </button>
          </div>
        )}

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* Revenue */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                ₹
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                ₹{stats.summary.totalRevenue.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +18.4%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Excludes cancelled orders</p>
          </div>

          {/* Orders */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Orders
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {stats.summary.totalOrders}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {stats.orderStatuses['Pending'] || 0} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.orderStatuses['Delivered'] || 0} successfully delivered
            </p>
          </div>

          {/* Products */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Products
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {stats.summary.totalProducts}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {stats.summary.inStockProducts} Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.summary.outOfStockProducts} out of stock
            </p>
          </div>

          {/* Users */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Customers
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {stats.summary.totalUsers}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Registered accounts</p>
          </div>
        </div>

        {/* 7-Day Revenue Trend & Order Fulfillment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">7-Day Sales &amp; Revenue Trend</h3>
                <p className="text-xs text-slate-500">Daily gross revenue over the past week</p>
              </div>
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                Weekly Gross
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
              {stats.salesTrend && stats.salesTrend.length > 0 ? (
                stats.salesTrend.map((day, idx) => {
                  const maxRevenue = Math.max(
                    ...stats.salesTrend.map((d) => d.revenue),
                    1000
                  );
                  const heightPercent = Math.max(8, Math.round((day.revenue / maxRevenue) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none z-20">
                        ₹{day.revenue.toLocaleString()} ({day.orders} orders)
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[42px] bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                      />
                      <span className="text-[11px] font-bold text-slate-500">{day.day}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full text-center text-xs text-slate-400 py-16">
                  No sales trend data available yet
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-1">
              <span>Last 7 Days</span>
              <span className="font-semibold text-slate-600">
                Total: ₹{stats.salesTrend?.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Fulfillment Status Breakdown */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Order Fulfillment</h3>
              <p className="text-xs text-slate-500 mb-5">Current status distribution</p>

              <div className="space-y-3.5">
                {[
                  { status: 'Delivered', count: stats.orderStatuses['Delivered'] || 0, color: 'bg-emerald-500' },
                  { status: 'Processing', count: stats.orderStatuses['Processing'] || 0, color: 'bg-blue-500' },
                  { status: 'Out for Delivery', count: stats.orderStatuses['Out for Delivery'] || 0, color: 'bg-sky-500' },
                  { status: 'Pending', count: stats.orderStatuses['Pending'] || 0, color: 'bg-amber-500' },
                  { status: 'Cancelled', count: stats.orderStatuses['Cancelled'] || 0, color: 'bg-rose-500' }
                ].map((item, i) => {
                  const total = stats.summary.totalOrders || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>{item.status}</span>
                        <span className="text-slate-500">{item.count} orders ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => navigate('/orders')}
              className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Manage All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Orders Preview */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Latest incoming supermarket transactions</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[540px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-brand-600">
                        #{ord._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800">{ord.user?.name || 'Customer'}</p>
                        <p className="text-[11px] text-slate-400">{ord.user?.email || '-'}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {ord.orderItems?.length || 1} items
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        ₹{(ord.totalPrice || ord.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(
                            ord.status
                          )}`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No recent orders placed yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardOverview;

