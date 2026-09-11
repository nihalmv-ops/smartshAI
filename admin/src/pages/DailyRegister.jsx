import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Banknote,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  MinusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { registerService } from '../services/registerService';

export default function DailyRegister() {
  const [loading, setLoading] = useState(true);
  const [liveStats, setLiveStats] = useState(null);
  const [register, setRegister] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Forms
  const [openingInput, setOpeningInput] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [actualClosingInput, setActualClosingInput] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegisterData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [todayData, histData] = await Promise.all([
        registerService.getTodayRegister(),
        registerService.getHistory()
      ]);
      setRegister(todayData.register);
      setLiveStats(todayData.liveStats);
      setHistory(histData.registers || []);
      if (todayData.register?.openingCash) {
        setOpeningInput(todayData.register.openingCash.toString());
      }
    } catch (err) {
      console.error('Failed to load cash register data:', err);
      setError('Could not load cash register information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegisterData();
  }, []);

  const handleOpenRegister = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await registerService.openRegister(Number(openingInput) || 0);
      setShowOpenModal(false);
      fetchRegisterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating opening cash');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      alert('Please enter a valid withdrawal amount');
      return;
    }
    try {
      setActionLoading(true);
      await registerService.recordWithdrawal(Number(withdrawAmount), withdrawNotes);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawNotes('');
      fetchRegisterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error recording withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseRegister = async (e) => {
    e.preventDefault();
    if (actualClosingInput === '') {
      alert('Please enter actual physical cash counted in drawer');
      return;
    }
    try {
      setActionLoading(true);
      await registerService.closeRegister(Number(actualClosingInput), closeNotes);
      setShowCloseModal(false);
      setActualClosingInput('');
      setCloseNotes('');
      fetchRegisterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error closing cash register');
    } finally {
      setActionLoading(false);
    }
  };

  const isOpen = liveStats?.status === 'Open';
  const expectedCash = liveStats?.expectedClosingCash || 0;
  const countedNum = Number(actualClosingInput) || 0;
  const liveDiff = actualClosingInput !== '' ? countedNum - expectedCash : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-emerald-400" />
            Daily Cash Register & Drawer Closing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Reconcile physical cash drawer with live counter POS sales and cash payouts. Zero discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRegisterData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh Drawer State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isOpen ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition cursor-pointer text-xs"
              >
                <MinusCircle className="w-4 h-4 text-amber-400" />
                Bank Drop / Withdrawal
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer text-xs"
              >
                <Lock className="w-4 h-4" />
                Close Shift Register
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer text-xs"
            >
              <Unlock className="w-4 h-4" />
              Open / Reopen Shift
            </button>
          )}
        </div>
      </div>

      {/* Main Drawer Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isOpen
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isOpen ? "Today's Drawer: ACTIVE OPEN" : "Today's Drawer: CLOSED"}
            </span>

            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          <button
            onClick={() => setShowOpenModal(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
          >
            {liveStats?.openingCash === 0 ? '+ Set Opening Cash Float' : 'Edit Opening Cash Float'}
          </button>
        </div>

        {/* Math Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Opening */}
          <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-2xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Opening Float</span>
              <Banknote className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-white mt-2">
              ₹{(liveStats?.openingCash || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Cash at shift start</span>
          </div>

          {/* Plus Cash Sales */}
          <div className="bg-slate-800/50 border border-emerald-500/30 p-4 rounded-2xl relative">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>(+) Cash Sales</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400 mt-2">
              +₹{(liveStats?.cashSales || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {liveStats?.cashSalesCount || 0} offline POS bills
            </span>
          </div>

          {/* Minus Cash Expenses */}
          <div className="bg-slate-800/50 border border-amber-500/30 p-4 rounded-2xl">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>(-) Cash Outflow</span>
              <ArrowDownRight className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">
              -₹{(liveStats?.cashExpenses || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Store expenses paid in cash</span>
          </div>

          {/* Minus Cash Withdrawals */}
          <div className="bg-slate-800/50 border border-purple-500/30 p-4 rounded-2xl">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center justify-between">
              <span>(-) Bank Drops</span>
              <ArrowDownRight className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-purple-400 mt-2">
              -₹{(liveStats?.cashWithdrawals || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Mid-day bank deposits</span>
          </div>

          {/* Expected Cash */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500/40 p-4 rounded-2xl shadow-xl">
            <div className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center justify-between">
              <span>(=) Expected Cash</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-3xl font-black text-white mt-2">₹{expectedCash.toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-emerald-300/80 mt-1 block font-medium">Must be in drawer right now</span>
          </div>
        </div>

        {/* Closed Reconciliation Card */}
        {!isOpen && register?.actualClosingCash !== undefined && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Shift Closed Result
              </span>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-base text-slate-300">
                  Physical Counted:{' '}
                  <strong className="text-white">₹{register.actualClosingCash?.toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-base text-slate-300">
                  Difference:{' '}
                  <strong
                    className={
                      register.difference === 0
                        ? 'text-emerald-400'
                        : register.difference > 0
                        ? 'text-sky-400'
                        : 'text-rose-400'
                    }
                  >
                    {register.difference === 0
                      ? '₹0 (Balanced)'
                      : register.difference > 0
                      ? `+₹${register.difference} (Over)`
                      : `-₹${Math.abs(register.difference)} (Short)`}
                  </strong>
                </span>
              </div>
            </div>

            {register.notes && (
              <p className="text-xs text-slate-400 italic bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                "{register.notes}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* History of Past Register Closings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Register Closing History (Past 30 Days)
          </h2>
          <span className="text-xs text-slate-400">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No past register closings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Opening Float</th>
                  <th className="p-3.5">Cash Sales</th>
                  <th className="p-3.5">Expenses & Drops</th>
                  <th className="p-3.5">Expected Cash</th>
                  <th className="p-3.5">Counted Cash</th>
                  <th className="p-3.5">Variance / Diff</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((h) => {
                  const variance = h.difference || 0;
                  const isBalanced = variance === 0;
                  return (
                    <tr key={h._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 text-xs text-white font-bold whitespace-nowrap">
                        {new Date(h.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">₹{(h.openingCash || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">
                        +₹{(h.cashSales || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-amber-400">
                        -₹{((h.cashExpenses || 0) + (h.cashWithdrawals || 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-slate-200 font-bold">
                        ₹{(h.expectedClosingCash || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3.5 font-mono text-white font-black">
                        {h.actualClosingCash !== undefined ? `₹${h.actualClosingCash.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        {h.status === 'Closed' ? (
                          <span
                            className={
                              isBalanced ? 'text-emerald-400' : variance > 0 ? 'text-sky-400' : 'text-rose-400'
                            }
                          >
                            {isBalanced
                              ? '₹0'
                              : variance > 0
                              ? `+₹${variance.toLocaleString('en-IN')}`
                              : `-₹${Math.abs(variance).toLocaleString('en-IN')}`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            h.status === 'Open'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isBalanced
                              ? 'bg-slate-800 text-slate-300'
                              : variance > 0
                              ? 'bg-sky-500/10 text-sky-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {h.status === 'Open' ? 'Active' : isBalanced ? 'Balanced' : variance > 0 ? 'Over' : 'Short'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Open / Adjust Opening Cash */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Set Shift Opening Cash Float
              </h2>
              <button
                onClick={() => setShowOpenModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Opening Cash Float in Register Drawer (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="2000"
                    value={openingInput}
                    onChange={(e) => setOpeningInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  The initial loose cash/change present in the cash drawer at the start of today's business.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Opening Cash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cash Withdrawal / Bank Drop */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-amber-400" />
                Record Cash Withdrawal / Bank Drop
              </h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Amount Withdrawn (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-lg focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Reason / Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bank deposit cash drop, Owner withdrawal"
                  value={withdrawNotes}
                  onChange={(e) => setWithdrawNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Record Cash Drop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Shift Register */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-400" />
                End-of-Day Cash Drawer Closing
              </h2>
              <button
                onClick={() => setShowCloseModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseRegister} className="p-6 space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                    Expected Cash in Drawer
                  </span>
                  <p className="text-2xl font-black text-white mt-1">₹{expectedCash.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Opening + Sales - Outflow</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Actual Physical Cash Counted (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    placeholder="Enter total cash counted"
                    value={actualClosingInput}
                    onChange={(e) => setActualClosingInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-black text-xl focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {actualClosingInput !== '' && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    liveDiff === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : liveDiff > 0
                      ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span className="text-xs font-bold">
                    {liveDiff === 0
                      ? '✓ Exact Match (Drawer Balanced)'
                      : liveDiff > 0
                      ? '⚠️ Surplus Cash (Drawer Over)'
                      : '⚠️ Shortage in Cash (Drawer Short)'}
                  </span>
                  <span className="font-mono font-black text-sm">
                    {liveDiff === 0
                      ? '₹0'
                      : liveDiff > 0
                      ? `+₹${liveDiff.toLocaleString('en-IN')}`
                      : `-₹${Math.abs(liveDiff).toLocaleString('en-IN')}`}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Closing Notes / Discrepancy Reason</label>
                <input
                  type="text"
                  placeholder="Optional closing remark"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Closing Drawer...' : 'Confirm & Close Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

