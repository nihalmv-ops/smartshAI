import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  Layers,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';

const REPORT_TYPES = [
  { id: 'sales', name: 'Comprehensive Sales Report', desc: 'All confirmed orders across all channels' },
  { id: 'product', name: 'Product Sales & Velocity Report', desc: 'Units, revenue, and gross profit by product' },
  { id: 'category', name: 'Category Performance Report', desc: 'Sales breakdown by grocery category' },
  { id: 'profit', name: 'Profit & Loss Statement (P&L)', desc: 'Revenue, COGS, Gross Profit, Expenses, Net Profit' },
  { id: 'expense', name: 'Store Operating Expenses Report', desc: 'Rent, electricity, salaries, and maintenance' },
  { id: 'payment', name: 'Payment Reconciliation Report', desc: 'Cash drawer vs UPI vs Card vs Netbanking' },
  { id: 'inventory', name: 'Inventory Valuation & Low Stock', desc: 'Current stock count, cost, and selling value' }
];

export default function ReportsManagement() {
  const [reportType, setReportType] = useState('sales');
  const [datePreset, setDatePreset] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channel, setChannel] = useState('all');

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({ rows: [], summary: {}, count: 0 });
  const [error, setError] = useState(null);

  const printAreaRef = useRef(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        reportType,
        channel
      };

      const now = new Date();
      if (datePreset === 'today') {
        params.startDate = now.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (datePreset === 'yesterday') {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        params.startDate = y.toISOString().split('T')[0];
        params.endDate = y.toISOString().split('T')[0];
      } else if (datePreset === 'week') {
        const w = new Date(now);
        w.setDate(now.getDate() - 7);
        params.startDate = w.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (datePreset === 'month') {
        const m = new Date(now.getFullYear(), now.getMonth(), 1);
        params.startDate = m.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (datePreset === 'last_month') {
        const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        params.startDate = lmStart.toISOString().split('T')[0];
        params.endDate = lmEnd.toISOString().split('T')[0];
      } else if (datePreset === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await analyticsService.getReportData(params);
      setReportData({
        rows: res.rows || [],
        summary: res.summary || {},
        count: res.count || 0
      });
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, datePreset, startDate, endDate, channel]);

  // Export to CSV Function
  const exportToCSV = () => {
    if (!reportData.rows || reportData.rows.length === 0) {
      alert('No data to export');
      return;
    }

    const rows = reportData.rows;
    let headers = Object.keys(rows[0]);
    let csvContent = '\uFEFF'; // UTF-8 BOM

    // Header line
    csvContent += headers.join(',') + '\r\n';

    // Data lines
    rows.forEach((row) => {
      const line = headers
        .map((field) => {
          let val = row[field];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          if (val.search(/("|,|\n)/g) >= 0) {
            val = `"${val}"`;
          }
          return val;
        })
        .join(',');
      csvContent += line + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SkylineMart_${reportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report Function
  const handlePrint = () => {
    window.print();
  };

  const activeReportConfig = REPORT_TYPES.find((r) => r.id === reportType);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header (Hidden on Print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-400" />
            Supermarket Business Reports & Statements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate formal Profit & Loss, multi-channel sales summaries, and tax-ready CSV/PDF reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            disabled={reportData.rows.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-40 text-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={reportData.rows.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-40 text-xs"
          >
            <Printer className="w-4 h-4" />
            Print / PDF Report
          </button>
        </div>
      </div>

      {/* Report Controls (Hidden on Print) */}
      <div className="print:hidden bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Date Range Filter</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
              <option value="month">This Month (Month-to-Date)</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Channel Filter (Only relevant for order-based reports) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Sales Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              disabled={['expense', 'inventory'].includes(reportType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold text-sm focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-40"
            >
              <option value="all">All Channels (Online + WhatsApp + POS)</option>
              <option value="offline">Offline Store Counter POS</option>
              <option value="online">Online Web Storefront</option>
              <option value="whatsapp">WhatsApp Orders</option>
            </select>
          </div>
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-bold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-400 font-bold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Printable Report Document Container */}
      <div
        ref={printAreaRef}
        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none p-6 space-y-6"
      >
        {/* Formal Header (Visible on screen and print) */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white print:text-black">SKYLINE MART</span>
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 print:border print:border-emerald-600">
                Official Statement
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-200 print:text-slate-800 mt-1">
              {activeReportConfig?.name}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">{activeReportConfig?.desc}</p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600 space-y-0.5 font-mono">
            <div>
              Generated: <strong className="text-white print:text-black">{new Date().toLocaleString('en-IN')}</strong>
            </div>
            <div>
              Channel: <strong className="text-white print:text-black uppercase">{channel}</strong>
            </div>
            <div>
              Records: <strong className="text-emerald-400 print:text-emerald-700">{reportData.count}</strong>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 print:hidden flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Compiling report records from database...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2 print:text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : reportData.rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 print:text-slate-600">
            No transactions found matching the selected timeframe and filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table based on Report Type */}
            {reportType === 'profit' ? (
              /* Profit & Loss Table */
              <div className="max-w-2xl mx-auto space-y-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                    {reportData.rows.map((r, i) => {
                      const isNet = r.metric.includes('Net Profit');
                      const isGross = r.metric.includes('Gross Profit');
                      return (
                        <tr
                          key={i}
                          className={`${
                            isNet
                              ? 'bg-emerald-500/10 print:bg-emerald-50 font-black text-base'
                              : isGross
                              ? 'bg-slate-800/40 print:bg-slate-100 font-bold'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-slate-300 print:text-slate-800">{r.metric}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white print:text-black">
                            {typeof r.value === 'number' ? `₹${r.value.toLocaleString('en-IN')}` : r.value}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Generic Multi-Column Table */
              <table className="w-full text-left text-xs text-slate-300 print:text-slate-800">
                <thead className="bg-slate-950/60 print:bg-slate-100 text-slate-400 print:text-slate-700 uppercase tracking-wider font-bold border-b border-slate-800 print:border-slate-300">
                  <tr>
                    {Object.keys(reportData.rows[0]).map((key) => (
                      <th key={key} className="p-3 capitalize whitespace-nowrap">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200 font-mono">
                  {reportData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                      {Object.keys(reportData.rows[0]).map((k) => (
                        <td key={k} className="p-3 whitespace-nowrap">
                          {typeof row[k] === 'number'
                            ? k.toLowerCase().includes('price') ||
                              k.toLowerCase().includes('profit') ||
                              k.toLowerCase().includes('cost') ||
                              k.toLowerCase().includes('amount') ||
                              k.toLowerCase().includes('revenue')
                              ? `₹${row[k].toLocaleString('en-IN')}`
                              : row[k]
                            : String(row[k] || '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Accounting Signatures Footer (Visible on Print) */}
        <div className="hidden print:flex justify-between pt-16 mt-12 border-t border-slate-300 text-xs text-slate-600">
          <div>
            <div className="border-t border-slate-400 w-48 pt-1 text-center font-bold">Store Manager Signature</div>
            <p className="text-[10px] text-center text-slate-500 mt-0.5">Skyline Mart Counter</p>
          </div>
          <div>
            <div className="border-t border-slate-400 w-48 pt-1 text-center font-bold">Authorized Accountant</div>
            <p className="text-[10px] text-center text-slate-500 mt-0.5">Financial Audit</p>
          </div>
        </div>
      </div>
    </div>
  );
}

