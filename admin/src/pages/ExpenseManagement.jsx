import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Filter,
  Calendar,
  IndianRupee,
  Building,
  Zap,
  Users,
  Truck,
  Wrench,
  Package,
  Megaphone,
  ShoppingBag,
  HelpCircle,
  CreditCard,
  Banknote,
  Smartphone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { expenseService } from '../services/expenseService';

const CATEGORIES = [
  { value: 'Rent', label: 'Store Rent', icon: Building, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { value: 'Electricity', label: 'Electricity & Utilities', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { value: 'Staff Salary', label: 'Staff Salary', icon: Users, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { value: 'Transportation', label: 'Logistics & Transport', icon: Truck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'Maintenance', label: 'Repairs & Maintenance', icon: Wrench, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { value: 'Packaging', label: 'Packaging & Bags', icon: Package, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { value: 'Marketing', label: 'Marketing & Ads', icon: Megaphone, color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  { value: 'Inventory Purchase', label: 'Inventory / Stock Buy', icon: ShoppingBag, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  { value: 'Other', label: 'General / Other', icon: HelpCircle, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' }
];

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash Drawer', icon: Banknote },
  { value: 'UPI', label: 'UPI / QR', icon: Smartphone },
  { value: 'Bank Transfer', label: 'Bank Transfer / NEFT', icon: Building },
  { value: 'Card', label: 'Debit / Credit Card', icon: CreditCard },
  { value: 'Other', label: 'Other', icon: HelpCircle }
];

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('month'); // 'today', 'week', 'month', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Add Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Electricity',
    amount: '',
    description: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const now = new Date();
      if (dateRange === 'today') {
        params.startDate = now.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateRange === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        params.startDate = startOfWeek.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        params.startDate = startOfMonth.toISOString().split('T')[0];
        params.endDate = now.toISOString().split('T')[0];
      } else if (dateRange === 'custom') {
        if (customStart) params.startDate = customStart;
        if (customEnd) params.endDate = customEnd;
      }

      const data = await expenseService.getExpenses(params);
      setExpenses(data.expenses || []);
      setTotalAmount(data.totalExpenseAmount || 0);
      setCategoryBreakdown(data.categoryBreakdown || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setError('Could not load expense records. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, dateRange, customStart, customEnd]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please enter a description or vendor name');
      return;
    }

    try {
      setSaving(true);
      await expenseService.createExpense({
        ...formData,
        amount: Number(formData.amount)
      });
      setShowModal(false);
      setFormData({
        category: 'Electricity',
        amount: '',
        description: '',
        paymentMethod: 'Cash',
        referenceNumber: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenses();
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert(err.response?.data?.message || 'Error recording expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await expenseService.deleteExpense(id);
      fetchExpenses();
    } catch (err) {
      console.error('Failed to delete expense:', err);
      alert('Could not delete expense record');
    }
  };

  // Compute Cash vs Non-Cash
  const cashExpensesTotal = expenses
    .filter((e) => e.paymentMethod === 'Cash')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const nonCashExpensesTotal = totalAmount - cashExpensesTotal;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-emerald-400" />
            Operating Expenses & Outflow
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track store rent, electricity, salaries, and daily running overhead to calculate true Net Profit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExpenses}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">₹{totalAmount.toLocaleString('en-IN')}</p>
          <span className="text-xs text-slate-500 mt-1 block">{expenses.length} transaction records</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Cash Drawer Outflow</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-300 mt-2">₹{cashExpensesTotal.toLocaleString('en-IN')}</p>
          <span className="text-xs text-slate-500 mt-1 block">Deducted from register drawer</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Digital / Bank Paid</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-300 mt-2">₹{Math.max(0, nonCashExpensesTotal).toLocaleString('en-IN')}</p>
          <span className="text-xs text-slate-500 mt-1 block">UPI, Cards, NEFT transfers</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Top Spend Category</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-white mt-2 truncate">
            {categoryBreakdown.length > 0 ? categoryBreakdown[0]._id : 'None'}
          </p>
          <span className="text-xs text-indigo-400/80 mt-1 block">
            {categoryBreakdown.length > 0
              ? `₹${(categoryBreakdown[0].totalAmount || 0).toLocaleString('en-IN')} (${Math.round(
                  ((categoryBreakdown[0].totalAmount || 0) / (totalAmount || 1)) * 100
                )}%)`
              : 'No expenses'}
          </span>
        </div>
      </div>

      {/* Category Breakdown & Progress */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            Expense Distribution by Category
          </h3>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => {
              const catConfig = CATEGORIES.find((c) => c.value === cat._id) || {
                label: cat._id,
                color: 'text-slate-400 bg-slate-500/10'
              };
              const pct = totalAmount > 0 ? Math.round((cat.totalAmount / totalAmount) * 100) : 0;
              return (
                <div key={cat._id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-300">{catConfig.label || cat._id}</span>
                    <span className="text-slate-400 font-bold">
                      ₹{(cat.totalAmount || 0).toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDateRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateRange === 'today' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateRange === 'week' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateRange === 'month' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              dateRange === 'custom' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Custom Range
          </button>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Expense Transactions ({expenses.length})
          </h2>
          <span className="text-xs text-slate-400">Total: ₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading expense records...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No expenses recorded for this timeframe. Click "Record Expense" to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description / Vendor</th>
                  <th className="p-3.5">Payment Mode</th>
                  <th className="p-3.5">Ref / Bill #</th>
                  <th className="p-3.5 text-right">Amount (₹)</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((item) => {
                  const cat = CATEGORIES.find((c) => c.value === item.category);
                  const Icon = cat?.icon || Receipt;
                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 text-xs text-slate-400 font-mono whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            cat?.color || 'text-slate-300 bg-slate-800 border-slate-700'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-white max-w-xs truncate">{item.description}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                            item.paymentMethod === 'Cash'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs text-slate-400 font-mono">{item.referenceNumber || '—'}</td>
                      <td className="p-3.5 text-right font-black text-red-400 text-sm">
                        -₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteExpense(item._id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Record Operating Expense
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Expense Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => {
                    const CatIcon = c.icon;
                    const isSelected = formData.category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: c.value })}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CatIcon className="w-4 h-4 mb-1" />
                        <span className="text-[11px] leading-tight line-clamp-1">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Amount (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="500"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Description / Payee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., BESCOM Electricity Bill August, Shop Rent, Carry bags 500 pcs"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Paid From / Mode *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {formData.paymentMethod === 'Cash' && (
                    <p className="text-[10px] text-amber-400 mt-1">⚠️ Will reduce live Cash Drawer total</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Bill / Reference #</label>
                  <input
                    type="text"
                    placeholder="Optional receipt #"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

