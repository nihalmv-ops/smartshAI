import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500">Checking authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to separate admin login if admin route, else customer login
    return <Navigate to={adminOnly ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Administrator Clearance Required</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          You are currently signed in as a customer account. Please log in through the Administrator Portal to access this dashboard.
        </p>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Return to Store
          </a>
          <a
            href="/admin/login"
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Go to Admin Portal
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

