import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Layers,
  Package,
  CreditCard,
  Banknote,
  QrCode,
  Globe,
  MessageSquare,
  Store,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Filter,
  BarChart3,
  Percent
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { AdminHeader } from '../components/layout/AdminHeader';

export const SalesDashboard = () => {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesSummary, setSalesSummary] = useState(null);
  const [profitMetrics, setProfitMetrics] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [productRankBy, setProductRankBy] = useState('revenue'); // 'revenue', 'units', 'profit'
  const [activeChartTab, setActiveChartTab] = useState('revenue'); // 'revenue', 'channel', 'profit'

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [salesRes, chartRes, topProdRes] = await Promise.allSettled([
        analyticsService.getSalesOverview({ period }),
        analyticsService.getSalesChart(period),
        analyticsService.getTopProducts(productRankBy, 6)
      ]);

      if (salesRes.status === 'fulfilled' && salesRes.value) {
        setSalesSummary(salesRes.value.salesSummary);
        setProfitMetrics(salesRes.value.profitMetrics);
        setPaymentBreakdown(salesRes.value.paymentBreakdown);
      }

      if (chartRes.status === 'fulfilled' && chartRes.value?.chart) {
        setChartData(chartRes.value.chart);
      }

      if (topProdRes.status === 'fulfilled' && topProdRes.value?.products) {
        setTopProducts(topProdRes.value.products);
      }
    } catch (err) {
      console.error('Failed to load sales dashboard:', err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, productRankBy]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Computing financial analytics...</p>
      </div>
    );
  }

  const currentPeriodSales = salesSummary?.thisMonth || {};
  const lifetimeSales = salesSummary?.lifetime || {};
  const maxRevenueInChart = Math.max(...chartData.map((d) => d.revenue || 0), 100);

  return (
    <div className="flex-1 flex flex-col">
      <AdminHeader
        title="Sales, Profit &amp; Revenue Analytics"
        subtitle="Centralized financial calculations, multi-channel sales reconciliation, and profit trends"
        onRefresh={fetchData}
        refreshing={refreshing}
      />

      <main className="p-3.5 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Period Selector Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Reporting Timeframe:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: '3m', label: '3 Months' },
              { id: '6m', label: '6 Months' },
              { id: '1y', label: '1 Year' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Top Core Financial Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Sales */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              💰 Total Sales
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{(profitMetrics?.revenue || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
              {period.toUpperCase()} Revenue
            </span>
          </div>

          {/* Gross Profit */}
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              📈 Gross Profit
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
              ₹{(profitMetrics?.grossProfit || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Revenue − COGS</span>
          </div>

          {/* Profit Margin */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              📊 Profit Margin
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
              {profitMetrics?.profitMargin || 0}%
            </h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Gross Margin Rate</span>
          </div>

          {/* Total Orders */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              🛒 Total Orders
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {(profitMetrics?.totalOrders || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Completed Bills</span>
          </div>

          {/* Products Sold */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              📦 Units Sold
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {(profitMetrics?.unitsSold || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Grocery Items</span>
          </div>

          {/* Average Order Value */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              💳 Avg Order Value
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{(profitMetrics?.aov || 0).toLocaleString()}
            </h3>
            <span className="text-[10px] text-slate-400 mt-0.5 block">AOV per Order</span>
          </div>
        </div>

        {/* 2. Channel Sales Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Online Sales */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-sky-950 uppercase tracking-wider">
                  Online Storefront
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-1.5">
                ₹{(currentPeriodSales.onlineSales || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Website cart orders this month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              {Math.round(
                ((currentPeriodSales.onlineSales || 0) / (currentPeriodSales.totalRevenue || 1)) * 100
              )}
              %
            </div>
          </div>

          {/* WhatsApp Sales */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <WhatsAppIcon className="w-4 h-4 fill-emerald-600" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  WhatsApp Direct
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-1.5">
                ₹{(currentPeriodSales.whatsAppSales || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Chat-to-order sales this month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {Math.round(
                ((currentPeriodSales.whatsAppSales || 0) / (currentPeriodSales.totalRevenue || 1)) * 100
              )}
              %
            </div>
          </div>

          {/* Offline Store Counter (POS) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Offline Store Counter (POS)
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-1.5">
                ₹{(currentPeriodSales.offlineSales || 0).toLocaleString()}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">In-person register sales this month</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              {Math.round(
                ((currentPeriodSales.offlineSales || 0) / (currentPeriodSales.totalRevenue || 1)) * 100
              )}
              %
            </div>
          </div>
        </div>

        {/* 3. Sales Trend & Channel Comparison Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {activeChartTab === 'revenue'
                  ? 'Revenue & Sales Velocity'
                  : activeChartTab === 'channel'
                  ? 'Channel Sales Distribution'
                  : 'Gross Profit & Margin Trend'}
              </h3>
              <p className="text-xs text-slate-500">
                Data dynamically grouped over selected timeframe ({period})
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setActiveChartTab('channel')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'channel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Channel Split
              </button>
              <button
                onClick={() => setActiveChartTab('profit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'profit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Profit vs Cost
              </button>
            </div>
          </div>

          {/* Visual Responsive Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-1 pt-6 pb-2 px-2 border-b border-slate-100 overflow-x-auto">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No recorded sales in this period
              </div>
            ) : (
              chartData.map((d, i) => {
                const heightPct = Math.max(5, Math.round((d.revenue / maxRevenueInChart) * 100));
                const profitPct = d.revenue > 0 ? Math.round((d.grossProfit / maxRevenueInChart) * 100) : 0;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[20px] group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-14 hidden group-hover:flex flex-col items-center z-20 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                      <span>{d.date}</span>
                      <span className="font-bold text-emerald-400">₹{d.revenue.toLocaleString()}</span>
                      <span className="text-slate-300">Profit: ₹{d.grossProfit.toLocaleString()}</span>
                    </div>

                    <div className="w-full max-w-[28px] h-40 flex items-end justify-center">
                      {activeChartTab === 'channel' ? (
                        <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${heightPct}%` }}>
                          <div
                            className="bg-sky-500 w-full"
                            style={{
                              height: `${(d.onlineRevenue / (d.revenue || 1)) * 100}%`
                            }}
                            title="Online"
                          />
                          <div
                            className="bg-emerald-500 w-full"
                            style={{
                              height: `${(d.whatsAppRevenue / (d.revenue || 1)) * 100}%`
                            }}
                            title="WhatsApp"
                          />
                          <div
                            className="bg-amber-500 w-full"
                            style={{
                              height: `${(d.offlineRevenue / (d.revenue || 1)) * 100}%`
                            }}
                            title="Offline"
                          />
                        </div>
                      ) : activeChartTab === 'profit' ? (
                        <div className="w-full relative flex items-end justify-center" style={{ height: `${heightPct}%` }}>
                          <div className="w-full bg-slate-200 rounded-t" style={{ height: '100%' }} />
                          <div
                            className="w-full bg-emerald-500 rounded-t absolute bottom-0"
                            style={{ height: `${profitPct}%` }}
                          />
                        </div>
                      ) : (
                        <div
                          className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all"
                          style={{ height: `${heightPct}%` }}
                        />
                      )}
                    </div>

                    <span className="text-[9px] font-bold text-slate-400 truncate max-w-[32px]">
                      {d.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1">
            {activeChartTab === 'channel' ? (
              <>
                <span className="flex items-center gap-1.5 text-sky-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Online Sales
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> WhatsApp Sales
                </span>
                <span className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Offline POS Sales
                </span>
              </>
            ) : activeChartTab === 'profit' ? (
              <>
                <span className="flex items-center gap-1.5 text-slate-600 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Cost of Goods (COGS)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Gross Profit
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Daily Revenue
              </span>
            )}
          </div>
        </div>

        {/* 4. Payment Method Reconciliation & Top Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Payment Method Breakdown: 5 Cols */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Payment Reconciliation</h3>
              <p className="text-xs text-slate-500">
                Verified payment collection across all channels (₹{paymentBreakdown?.totalReconciled?.toLocaleString() || 0} total)
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {paymentBreakdown?.breakdown &&
                Object.entries(paymentBreakdown.breakdown).map(([mode, data]) => {
                  const pct = paymentBreakdown.totalReconciled > 0
                    ? Math.round((data.amount / paymentBreakdown.totalReconciled) * 100)
                    : 0;

                  return (
                    <div key={mode} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          {mode === 'Cash' && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                          {mode === 'UPI' && <QrCode className="w-3.5 h-3.5 text-indigo-600" />}
                          {mode === 'Card' && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                          {mode}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({data.count} txns)
                          </span>
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{data.amount.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            mode === 'Cash'
                              ? 'bg-emerald-500'
                              : mode === 'UPI'
                              ? 'bg-indigo-500'
                              : mode === 'Card'
                              ? 'bg-blue-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Top Selling Products: 7 Cols */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Best Selling Products</h3>
                <p className="text-xs text-slate-500">Products sorted by commercial velocity</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setProductRankBy('revenue')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    productRankBy === 'revenue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  By Revenue
                </button>
                <button
                  onClick={() => setProductRankBy('profit')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    productRankBy === 'profit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  By Profit
                </button>
                <button
                  onClick={() => setProductRankBy('units')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                    productRankBy === 'units' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  By Units
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2">Product</th>
                    <th className="pb-2 text-center">Units Sold</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Gross Profit</th>
                    <th className="pb-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No sales data found yet.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 font-bold text-slate-900 flex items-center gap-2">
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover bg-slate-50 border shrink-0"
                            />
                          )}
                          <span className="truncate max-w-[140px]">{p.name}</span>
                        </td>
                        <td className="py-2.5 text-center font-bold">{p.unitsSold}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{p.revenue.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-700">
                          ₹{p.grossProfit.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px]">
                            {p.profitMargin}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;
