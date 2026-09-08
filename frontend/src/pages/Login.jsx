import React, { useState } from 'react';
import { ShoppingCart, Mail, Lock, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export const Login = ({ navigateTo }) => {
  const { login, googleLogin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigateTo('home');
      }, 900);
    } else {
      setError(res.message || 'Invalid email or password.');
    }
  };

  const handleQuickLogin = async (userEmail, userPassword) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
    setSubmitting(true);
    const res = await login(userEmail, userPassword);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigateTo('home');
      }, 900);
    } else {
      setError(res.message || 'Quick login failed.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setSubmitting(true);
    const res = await googleLogin({
      credential: credentialResponse.credential,
      client_id: credentialResponse.clientId
    });
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigateTo('home');
      }, 900);
    } else {
      setError(res.message || 'Google Sign-In failed.');
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or encountered an error.');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div 
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back to Smart<span className="text-brand-500">Mart</span> AI
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to access your saved basket, fast address checkout &amp; live orders
          </p>
        </div>

        {/* Quick Test Accounts Bar */}
        <div className="bg-brand-50/80 border border-brand-200/80 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Instant Test Accounts (1-Click)</span>
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-200/60 text-brand-800">
              Database Seeded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@smartmart.ai', 'adminpassword123')}
              disabled={submitting}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-brand-200 text-brand-900 text-xs font-bold rounded-xl shadow-xs transition-all text-left flex items-center justify-between"
            >
              <div>
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                  Admin
                </p>
                <p className="text-[10px] text-slate-400 font-normal">Full Catalog CRUD</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('rahul.s@smartmart.ai', 'userpassword123')}
              disabled={submitting}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-brand-200 text-brand-900 text-xs font-bold rounded-xl shadow-xs transition-all text-left flex items-center justify-between"
            >
              <div>
                <p className="font-bold">Customer</p>
                <p className="text-[10px] text-slate-400 font-normal">Cart &amp; Orders</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200/80 shadow-soft">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Signed In Successfully!</h3>
              <p className="text-xs text-slate-500">Redirecting to fresh groceries...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 animate-fadeIn">
                  {error}
                </div>
              )}

              {/* Real Google Sign-In Button */}
              <div className="flex flex-col items-center justify-center pb-2">
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    shape="pill"
                    text="continue_with"
                    width="100%"
                  />
                </div>
                <div className="relative w-full text-center mt-5 mb-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Or sign in with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@smartmart.ai"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || authLoading}
                  className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-70 cursor-pointer"
                >
                  {submitting || authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
            <div>
              Don't have an account yet?{' '}
              <button
                onClick={() => navigateTo('register')}
                className="text-brand-600 font-bold hover:underline"
              >
                Create Account
              </button>
            </div>
            <div className="pt-1.5">
              <button
                onClick={() => navigateTo('admin/login')}
                className="text-slate-400 hover:text-brand-600 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                <span>Store Administrator? Access Admin Portal →</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
