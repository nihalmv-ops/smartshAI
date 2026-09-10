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
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLogin = ({ navigateTo: propNavigateTo }) => {
  const navigate = useNavigate();
  const navigateTo = (page) => {
    if (propNavigateTo) propNavigateTo(page);
    else if (page === 'home') navigate('/');
    else if (page === 'admin') navigate('/admin');
    else navigate(`/${page}`);
  };

  const { login, registerAdmin, logout, user, isAdmin, isAuthenticated } = useAuth();

  const [activeMode, setActiveMode] = useState('login'); // 'login' | 'register'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [adminSecretKey, setAdminSecretKey] = useState('SMARTMART_ADMIN_2026');

  // Handle Admin Sign In
  const handleAdminLogin = async (e) => {
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
        if (res.user.role === 'admin') {
          setSuccess('Administrator access granted. Redirecting to Control Center...');
          setTimeout(() => {
            navigate('/admin');
          }, 800);
        } else {
          // Deny access if regular customer
          logout();
          setError('Access Denied: This account does not possess Administrator clearance.');
        }
      } else {
        setError(res.message || 'Invalid administrator credentials.');
      }
    } catch (err) {
      setError(err.message || 'Failed to authenticate admin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Demo Admin Login
  const handleQuickAdminLogin = async () => {
    setLoginEmail('admin@smartmart.ai');
    setLoginPassword('Admin@123');
    setError('');
    setSubmitting(true);
    try {
      const res = await login('admin@smartmart.ai', 'Admin@123');
      if (res.success && res.user.role === 'admin') {
        setSuccess('Administrator access granted!');
        setTimeout(() => {
          navigate('/admin');
        }, 800);
      } else {
        setError('Quick login failed. Please check credentials.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Registering a New Admin
  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    if (!adminSecretKey.trim()) {
      setError('Admin Security Passcode is required to create an admin account.');
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
        setSuccess('New Administrator account registered! Loading Control Center...');
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      } else {
        setError(res.message || 'Failed to register administrator.');
      }
    } catch (err) {
      setError(err.message || 'Administrator registration rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0B1120] text-slate-100">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/25 border border-brand-400/30 animate-pulse-soft">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"></span>
              Restricted Portal • Authorized Staff Only
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Skyline Mart Admin Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Store management, live inventory dispatch &amp; AI analytics
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-black/50 space-y-6">
          
          {/* Mode Switcher Tabs */}
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

          {/* Feedback Messages */}
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

          {/* TAB 1: ADMIN LOGIN FORM */}
          {activeMode === 'login' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
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
                    <span>Verifying Clearance...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Admin Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Fill Demo Admin Button */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  disabled={submitting}
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Sign In with Default Admin</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CREATE NEW ADMIN FORM */}
          {activeMode === 'register' && (
            <form onSubmit={handleRegisterAdmin} className="space-y-3.5">
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
                    placeholder="Store Manager Name"
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
                    Phone (WhatsApp)
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

              {/* Admin Security Passcode */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Security Passcode *</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Protects unauthorized signup</span>
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
                  Default: <code className="text-amber-400">SMARTMART_ADMIN_2026</code> (configured in backend .env)
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
                    <span>Authorizing Administrator...</span>
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

          {/* Footer Back Link */}
          <div className="pt-2 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Customer Storefront</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminLogin;

