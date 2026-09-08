import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  Sparkles,
  ArrowRight,
  Package,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';

export const Navbar = ({ activePage, navigateTo, onOpenSearch }) => {
  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 1) {
      productService.getAllProducts({ search: val }).then(res => {
        if (res && res.products) {
          setSearchResults(res.products.slice(0, 5));
          setShowSearchDropdown(true);
        }
      }).catch(() => {
        const results = productService.searchAndFilterLocal({ query: val });
        setSearchResults(results.slice(0, 5));
        setShowSearchDropdown(true);
      });
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    navigateTo('products', { searchQuery });
  };

  const selectSearchResult = (product) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    navigateTo('product-details', { productId: product._id || product.id });
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      {/* Top Banner (Optional small notification) */}
      <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-sky-500 text-white text-xs py-1.5 px-4 text-center font-medium hidden md:flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
        <span>Get <strong>20% OFF</strong> on your first grocery order with code <strong>FRESH20</strong> • Free Delivery on orders over ₹199</span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-md sm:shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">Smart<span className="text-brand-500">Mart</span></span>
                <span className="px-1 py-0.2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded">AI</span>
              </div>
              <p className="text-[9px] sm:text-[11px] font-semibold tracking-wider text-slate-400 uppercase hidden xs:block">Fresh • Fast • Reliable</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`transition-colors relative py-1 hover:text-brand-500 ${
                  activePage === item.id 
                    ? 'text-brand-500 font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-brand-500 after:rounded-full' 
                    : ''
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Search Bar matching mockup */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-md mx-2 relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search products..."
                className="w-full pl-4 pr-12 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-sm text-slate-800 placeholder-slate-400 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors shadow-sm cursor-pointer"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Live Search Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 overflow-hidden animate-fadeIn">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Products ({searchResults.length})
                </div>
                {searchResults.map((prod) => (
                  <div
                    key={prod.id || prod._id}
                    onClick={() => selectSearchResult(prod)}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-10 h-10 object-cover rounded-lg bg-slate-100" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{prod.name}</p>
                      <p className="text-xs text-slate-500">{prod.unit} • <span className="font-bold text-brand-600">₹{prod.price}</span></p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Wishlist Icon */}
            <button
              onClick={() => navigateTo('wishlist')}
              className="relative p-2 sm:p-2.5 text-slate-600 hover:text-brand-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalWishlist > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-5 px-1 bg-rose-500 text-white text-[10px] sm:text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {totalWishlist}
                </span>
              )}
            </button>

            {/* Cart Icon with Live Count */}
            <button
              onClick={() => navigateTo('cart')}
              className="relative p-2 sm:p-2.5 text-slate-600 hover:text-brand-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] sm:min-w-[20px] sm:h-5 px-1 bg-brand-500 text-white text-[10px] sm:text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Admin Shortcut Pill */}
            {isAuthenticated && user?.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin')}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            {/* User Profile / Auth */}
            <div ref={profileRef} className="relative">
              {isAuthenticated ? (
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2 sm:pl-2 sm:pr-3 py-1 sm:py-1.5 rounded-full hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 hidden sm:inline max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  onClick={() => navigateTo('login')}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border border-brand-500 text-brand-600 hover:bg-brand-500 hover:text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                >
                  Login
                </button>
              )}

              {/* Profile Dropdown */}
              {profileDropdownOpen && isAuthenticated && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                      {user.role === 'admin' && (
                        <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); navigateTo('orders'); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>My Orders</span>
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); navigateTo('cart'); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>My Cart</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{totalItems}</span>
                  </button>
                  <button
                    onClick={() => { setProfileDropdownOpen(false); navigateTo('wishlist'); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>My Wishlist</span>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-medium">{totalWishlist}</span>
                  </button>

                  {user.role === 'admin' && (
                    <>
                      <div className="border-t border-slate-100 my-1"></div>
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Admin Portal
                      </div>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigateTo('admin'); }}
                        className="w-full text-left px-4 py-2 text-sm text-amber-900 font-bold hover:bg-amber-50 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Admin Dashboard</span>
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigateTo('admin/products'); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>Manage Products</span>
                      </button>
                      <button
                        onClick={() => { setProfileDropdownOpen(false); navigateTo('admin/orders'); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        <span>Manage Orders</span>
                      </button>
                    </>
                  )}

                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search 1,000+ grocery products..."
              className="w-full pl-4 pr-11 py-2 bg-slate-100 text-sm text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            <button
              type="submit"
              className="absolute right-1 w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigateTo(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                activePage === item.id
                  ? 'bg-brand-50 text-brand-600 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {!isAuthenticated ? (
              <button
                onClick={() => {
                  navigateTo('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm shadow-md text-center"
              >
                Sign In to SmartMart AI
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-600 font-semibold px-3 py-1 bg-white rounded-lg border border-rose-200"
                  >
                    Logout
                  </button>
                </div>
                <button
                  onClick={() => {
                    navigateTo('orders');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-slate-400" />
                  <span>View My Orders</span>
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      navigateTo('admin/products');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Admin: Manage Products</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

