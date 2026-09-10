import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ProtectedAdminRoute } from './components/common/ProtectedAdminRoute';
import { AdminLayout } from './components/layout/AdminLayout';

import { AdminLogin } from './pages/AdminLogin';
import { DashboardOverview } from './pages/DashboardOverview';
import { ProductManagement } from './pages/ProductManagement';
import { CategoryManagement } from './pages/CategoryManagement';
import { OrderManagement } from './pages/OrderManagement';
import { UserManagement } from './pages/UserManagement';
import { AIAnalytics } from './pages/AIAnalytics';
import { WhatsAppSettings } from './pages/WhatsAppSettings';

// New Supermarket Management Pages
import OfflinePOS from './pages/OfflinePOS';
import SalesDashboard from './pages/SalesDashboard';
import ExpenseManagement from './pages/ExpenseManagement';
import DailyRegister from './pages/DailyRegister';
import BusinessGrowth from './pages/BusinessGrowth';
import ReportsManagement from './pages/ReportsManagement';

export const App = () => {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<AdminLogin />} />

          {/* Protected Executive Admin Control Center */}
          <Route
            path="/"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            {/* Store Operations */}
            <Route index element={<DashboardOverview />} />
            <Route path="pos" element={<OfflinePOS />} />
            <Route path="orders" element={<OrderManagement />} />

            {/* Finance & Accounts */}
            <Route path="sales" element={<SalesDashboard />} />
            <Route path="expenses" element={<ExpenseManagement />} />
            <Route path="register" element={<DailyRegister />} />
            <Route path="reports" element={<ReportsManagement />} />

            {/* Growth & Intelligence */}
            <Route path="growth" element={<BusinessGrowth />} />
            <Route path="analytics" element={<AIAnalytics />} />

            {/* Catalog & Settings */}
            <Route path="products" element={<ProductManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="whatsapp-settings" element={<WhatsAppSettings />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
};

export default App;
