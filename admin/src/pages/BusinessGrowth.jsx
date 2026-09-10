import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  ShoppingBag,
  Target,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Award,
  BarChart3,
  RefreshCw,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

export default function BusinessGrowth() {
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [aiInsights, setAIInsights] = useState([]);
  const [error, setError] = useState(null);

  const fetchGrowthAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [growthRes, customerRes, categoryRes, healthRes, aiRes] = await Promise.all([
        analyticsService.getGrowth(),
        analyticsService.getCustomers(),
        analyticsService.getCategories(),
        analyticsService.getBusinessHealth(),
        analyticsService.getAIInsights()
      ]);

      setGrowthData(growthRes);
      setCustomerData(customerRes);
      setCategoryData(categoryRes.categories || []);
      setHealthData(healthRes.health || null);
      setAIInsights(aiRes.data?.insights || []);
    } catch (err) {
      console.error('Failed to fetch business growth analytics:', err);
      setError('Could not load growth analytics from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowthAnalytics();
  }, []);

  const growth = growthData?.growth || {};
  const cur = growthData?.currentPeriod || {};
  const prev = growthData?.previousPeriod || {};

  const renderGrowthBadge = (value) => {
    const num = Number(value) || 0;
    if (num > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
          <ArrowUpRight className="w-3.5 h-3.5" />
          +{num}%
        </span>
      );
    } else if (num < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
          <ArrowDownRight className="w-3.5 h-3.5" />
          {num}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
        0.0%
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Supermarket Growth & Customer Retention
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Month-over-Month velocity, Customer Lifetime Value (CLV), Repeat purchase rate, and Data-grounded AI insights.
          </p>
        </div>

        <button
          onClick={fetchGrowthAnalytics}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Growth Metrics
        </button>
      </div>

      {/* AI Business Insights Banner */}
      {aiInsights.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Automated Supermarket Executive Insights</h2>
              <p className="text-xs text-indigo-300/80">Calculated directly from confirmed store orders and expenses</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiInsights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      {insight.title}
                    </span>
                    <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded">
                      {insight.metric}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MoM Core Growth KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Sales Growth */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sales Growth (MoM)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-xl font-black text-white">₹{(cur.revenue || 0).toLocaleString('en-IN')}</p>
            {renderGrowthBadge(growth.salesGrowth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            vs ₹{(prev.revenue || 0).toLocaleString('en-IN')} in {prev.monthName?.split(' ')[0] || 'last mo'}
          </span>
        </div>

        {/* Profit Growth */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Profit Growth (MoM)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-xl font-black text-emerald-300">₹{(cur.grossProfit || 0).toLocaleString('en-IN')}</p>
            {renderGrowthBadge(growth.profitGrowth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            vs ₹{(prev.grossProfit || 0).toLocaleString('en-IN')} in {prev.monthName?.split(' ')[0] || 'last mo'}
          </span>
        </div>

        {/* Orders Velocity */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Order Volume</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-xl font-black text-white">{cur.orders || 0} orders</p>
            {renderGrowthBadge(growth.ordersGrowth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            vs {prev.orders || 0} in {prev.monthName?.split(' ')[0] || 'last mo'}
          </span>
        </div>

        {/* Average Order Value Growth */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Avg Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-xl font-black text-white">₹{cur.aov || 0}</p>
            {renderGrowthBadge(growth.aovGrowth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            vs ₹{prev.aov || 0} in {prev.monthName?.split(' ')[0] || 'last mo'}
          </span>
        </div>

        {/* New Customers */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">New Shoppers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-xl font-black text-white">+{cur.newCustomers || 0}</p>
            {renderGrowthBadge(growth.customerGrowth)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            vs {prev.newCustomers || 0} in {prev.monthName?.split(' ')[0] || 'last mo'}
          </span>
        </div>
      </div>

      {/* Two Columns: Customer Retention & Business Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Retention Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:col-span-1 space-y-5">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Shopper Retention & Loyalty
          </h2>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Repeat Purchase Rate
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-black text-emerald-400">{customerData?.repeatPurchaseRate || 0}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {customerData?.returningCustomers || 0} out of {customerData?.totalCustomersWithOrders || 0} shoppers have
              ordered more than once.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Registered Users:</span>
              <strong className="text-white font-mono">{customerData?.totalRegistered || 0}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Shoppers with Completed Orders:</span>
              <strong className="text-white font-mono">{customerData?.totalCustomersWithOrders || 0}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">One-Time Buyers:</span>
              <strong className="text-white font-mono">
                {Math.max(
                  0,
                  (customerData?.totalCustomersWithOrders || 0) - (customerData?.returningCustomers || 0)
                )}
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Loyal Repeat Shoppers:</span>
              <strong className="text-emerald-400 font-mono">{customerData?.returningCustomers || 0}</strong>
            </div>
          </div>
        </div>

        {/* Top 10 High Value Shoppers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Top 10 High-Value Shoppers (Customer Lifetime Value)
            </h2>
            <span className="text-xs text-slate-400">By total spend</span>
          </div>

          {customerData?.topCustomers?.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No customer purchase history available yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Rank</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">Contact</th>
                    <th className="p-2.5 text-center">Orders</th>
                    <th className="p-2.5 text-right">Lifetime Spend (₹)</th>
                    <th className="p-2.5 text-right">Last Order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customerData?.topCustomers?.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-2.5 font-bold">
                        <span
                          className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-950'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-white truncate max-w-[140px]">{c.name}</td>
                      <td className="p-2.5 text-slate-400 truncate max-w-[120px] font-mono">{c.phone || c.email || '—'}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-400">{c.orderCount}</td>
                      <td className="p-2.5 text-right font-black text-white">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right text-slate-400 whitespace-nowrap">
                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category Sales & Profit Contribution */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Category Profit & Revenue Contribution
          </h2>
          <span className="text-xs text-slate-400">{categoryData.length} active categories</span>
        </div>

        {categoryData.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No category performance records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Units Sold</th>
                  <th className="p-3 text-right">Revenue (₹)</th>
                  <th className="p-3 text-right">Cost (COGS)</th>
                  <th className="p-3 text-right">Gross Profit (₹)</th>
                  <th className="p-3 text-right">Profit Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {categoryData.map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white capitalize">{cat.category}</td>
                    <td className="p-3 text-right font-mono text-slate-400">{cat.unitsSold || 0}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      ₹{(cat.revenue || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      ₹{(cat.cost || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-400">
                      ₹{(cat.grossProfit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {cat.profitMargin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
