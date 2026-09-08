import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { Toast } from './components/common/Toast';
import { MobileBottomBar } from './components/common/MobileBottomBar';

// Pages
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetails } from './pages/ProductDetails';
import { Categories } from './pages/Categories';
import { Cart } from './pages/Cart';
import { Wishlist } from './pages/Wishlist';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Orders } from './pages/Orders';
import { AdminProducts } from './pages/AdminProducts';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top smoothly on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const navigateTo = (page, params = {}) => {
    if (page === 'home') navigate('/');
    else if (page === 'products') {
      const q = new URLSearchParams();
      if (params.category && params.category !== 'all') q.set('category', params.category);
      if (params.searchQuery) q.set('search', params.searchQuery);
      const str = q.toString();
      navigate(str ? `/products?${str}` : '/products');
    }
    else if (page === 'product-details') {
      navigate(`/products/${params.productId}`);
    }
    else {
      navigate(`/${page}`);
    }
  };

  const handleSelectProduct = (product) => {
    navigate(`/products/${product.id}`);
  };

  // Determine activePage for navbar highlight
  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/categories')) return 'categories';
    if (path.startsWith('/cart')) return 'cart';
    if (path.startsWith('/wishlist')) return 'wishlist';
    if (path.startsWith('/login')) return 'login';
    if (path.startsWith('/register')) return 'register';
    if (path.startsWith('/admin')) return 'admin';
    return 'home';
  };

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className={`min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 selection:bg-brand-500 selection:text-white ${!isAdmin ? 'pb-16 md:pb-0' : ''}`}>
            
            {/* Main Responsive Navbar */}
            <Navbar
              activePage={getActivePage()}
              navigateTo={navigateTo}
            />

            {/* Main Content Area */}
            <main className="flex-1">
              <Routes>
                <Route
                  path="/"
                  element={<Home navigateTo={navigateTo} onSelectProduct={handleSelectProduct} />}
                />
                <Route
                  path="/home"
                  element={<Home navigateTo={navigateTo} onSelectProduct={handleSelectProduct} />}
                />
                <Route
                  path="/products"
                  element={<Products navigateTo={navigateTo} onSelectProduct={handleSelectProduct} />}
                />
                <Route
                  path="/products/:id"
                  element={<ProductDetails navigateTo={navigateTo} onSelectProduct={handleSelectProduct} />}
                />
                <Route
                  path="/categories"
                  element={<Categories navigateTo={navigateTo} />}
                />
                <Route
                  path="/cart"
                  element={<Cart navigateTo={navigateTo} />}
                />
                <Route
                  path="/wishlist"
                  element={<Wishlist navigateTo={navigateTo} onSelectProduct={handleSelectProduct} />}
                />
                <Route
                  path="/login"
                  element={<Login navigateTo={navigateTo} />}
                />
                <Route
                  path="/register"
                  element={<Register navigateTo={navigateTo} />}
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders navigateTo={navigateTo} />
                    </ProtectedRoute>
                  }
                />
                {/* Separate Dedicated Admin Portal Routes */}
                <Route
                  path="/admin/login"
                  element={<AdminLogin navigateTo={navigateTo} />}
                />
                <Route
                  path="/admin-login"
                  element={<AdminLogin navigateTo={navigateTo} />}
                />
                <Route
                  path="/admin-portal"
                  element={<AdminLogin navigateTo={navigateTo} />}
                />

                {/* Protected Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard navigateTo={navigateTo} defaultTab="overview" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard navigateTo={navigateTo} defaultTab="products" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard navigateTo={navigateTo} defaultTab="orders" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard navigateTo={navigateTo} defaultTab="users" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminDashboard navigateTo={navigateTo} defaultTab="analytics" />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="*"
                  element={<Home navigateTo={navigateTo} onSelectProduct={handleSelectProduct} />}
                />
              </Routes>
            </main>

            {/* Global Footer */}
            <Footer
              navigateTo={navigateTo}
            />

            {/* Mobile Native Bottom Navigation Bar */}
            {!isAdmin && (
              <MobileBottomBar
                activePage={getActivePage()}
                navigateTo={navigateTo}
              />
            )}

            {/* Notification Toast */}
            <Toast />

          </div>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
