import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, registerAdmin } = useAdminAuth();
  const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173';

  const [activeMode, setActiveMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register admin state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('SMARTMART_ADMIN_2026');

  // Handle Admin Sign In
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginEmail || !loginPassword) {
      setError('Please provide both administrator email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res.success) {
        setSuccess('Access verified. Opening Control Center...');
        setTimeout(() => navigate('/'), 600);
      } else {
        setError(res.message || 'Authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Server error during sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Quick Demo Sign In
  const handleQuickDemo = async () => {
    setLoginEmail('admin@smartmart.ai');
    setLoginPassword('Admin@123');
    setError('');
    setSubmitting(true);
    try {
      const res = await login('admin@smartmart.ai', 'Admin@123');
      if (res.success) {
        setSuccess('Access verified. Opening Control Center...');
        setTimeout(() => navigate('/'), 600);
      } else {
        setError(res.message || 'Demo sign in failed.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Admin Creation with Passcode
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (!adminSecretKey.trim()) {
      setError('Admin Security Passcode is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerAdmin({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone || '+91 99999 11111',
        address: 'SmartMart AI HQ, Koramangala, Bengaluru',
        adminSecretKey: adminSecretKey.trim()
      });

      if (res.success) {
        setSuccess('Administrator account created! Accessing Control Center...');
        setTimeout(() => navigate('/'), 800);
      } else {
        setError(res.message || 'Registration rejected.');
      }
    } catch (err) {
      setError(err.message || 'Failed to register administrator.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-3.5 sm:px-6 lg:px-8 bg-[#0B1120] text-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Top Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 border border-brand-400/30 animate-pulse-soft">
            <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              Isolated Admin Site • Port 5174
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Skyline Mart Admin Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Store dispatch, real-time inventory &amp; WhatsApp customer deals
            </p>
          </div>
        </div>

        {/* Auth Container Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-4 sm:p-8 border border-slate-800 shadow-2xl shadow-black/50 space-y-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setError('');
                setSuccess('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeMode === 'login'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setError('');
                setSuccess('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                activeMode === 'register'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Admin
            </button>
          </div>

          {/* Feedback */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-semibold text-rose-300 flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@smartmart.ai"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Control Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  disabled={submitting}
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Sign In with Default Admin</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER ADMIN */}
          {activeMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Staff Manager Name"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Admin Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="manager@smartmart.ai"
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 99999 11111"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Security Passcode *</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Protects unauthorized access</span>
                </div>
                <input
                  type="text"
                  required
                  value={adminSecretKey}
                  onChange={(e) => setAdminSecretKey(e.target.value)}
                  placeholder="SMARTMART_ADMIN_2026"
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-amber-500/40 rounded-xl text-xs font-mono text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Passcode: <code className="text-amber-400">SMARTMART_ADMIN_2026</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 cursor-pointer mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Admin...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create Administrator Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Return link */}
          <div className="pt-2 text-center">
            <a
              href={storefrontUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <span>Visit Customer Storefront (Port 5173)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

