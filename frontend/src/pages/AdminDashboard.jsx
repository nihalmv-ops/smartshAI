import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Eye,
  Camera,
  UploadCloud,
  CheckCircle2,
  Clock,
  Truck,
  MessageSquare,
  Phone,
  Send
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { whatsappService } from '../services/whatsappService';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

export const AdminDashboard = ({ navigateTo, defaultTab = 'overview' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Store WhatsApp Admin Phone State
  const [adminPhone, setAdminPhone] = useState(whatsappService.getAdminPhone());
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState(whatsappService.getAdminPhone());

  // Stats state
  const [stats, setStats] = useState({
    summary: {
      totalUsers: 0,
      totalProducts: 0,
      inStockProducts: 0,
      outOfStockProducts: 0,
      totalOrders: 0,
      totalRevenue: 0
    },
    orderStatuses: {},
    salesTrend: [],
    recentOrders: [],
    aiAnalytics: {
      lowStockProducts: [],
      mostRecommended: [],
      popularSearches: []
    }
  });

  // Product management state
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productActionLoading, setProductActionLoading] = useState(false);

  const initialProductForm = {
    name: '',
    category: 'grocery',
    unit: '1 kg',
    price: 50,
    originalPrice: 60,
    stockCount: 50,
    inStock: true,
    badge: 'Fresh',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    description: 'Fresh and premium quality grocery item.'
  };
  const [productForm, setProductForm] = useState(initialProductForm);

  // Order management state
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // User management state
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load dashboard overview stats
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await adminService.getDashboardStats();
      if (res && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Load products
  const fetchProducts = async () => {
    try {
      const res = await productService.getAllProducts();
      if (res && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load products', 'error');
    }
  };

  // Load orders
  const fetchOrders = async () => {
    try {
      const res = await orderService.getAllOrders();
      if (res && res.orders) {
        setOrders(res.orders);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load orders', 'error');
    }
  };

  // Load users
  const fetchUsers = async () => {
    try {
      const res = await adminService.getUsers();
      if (res && res.users) {
        setUsersList(res.users);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load users list', 'error');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchProducts();
    fetchOrders();
    fetchUsers();
  }, []);

  // ----------------------------------------------------
  // Product Handlers
  // ----------------------------------------------------
  const handleOpenCreateProduct = () => {
    setEditingProductId(null);
    setProductForm(initialProductForm);
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProductId(prod._id || prod.id);
    setProductForm({
      name: prod.name,
      category: prod.category,
      unit: prod.unit,
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      stockCount: prod.stockCount !== undefined ? prod.stockCount : 50,
      inStock: prod.inStock !== undefined ? prod.inStock : true,
      badge: prod.badge || '',
      image: prod.image,
      description: prod.description || ''
    });
    setProductModalOpen(true);
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const res = await productService.uploadProductImage(file);
      if (res && res.imageUrl) {
        setProductForm((prev) => ({ ...prev, image: res.imageUrl }));
        showToast('Image uploaded successfully!');
      } else {
        throw new Error(res?.message || 'Failed to upload image');
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.image.trim()) {
      showToast('Name and Image are required', 'error');
      return;
    }

    setProductActionLoading(true);
    try {
      if (editingProductId) {
        await productService.updateProduct(editingProductId, productForm);
        showToast('Product updated successfully!');
      } else {
        await productService.createProduct(productForm);
        showToast('Product created successfully!');
      }
      setProductModalOpen(false);
      await fetchProducts();
      await fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setProductActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}"?`)) return;
    try {
      await productService.deleteProduct(id);
      showToast(`"${name}" deleted.`);
      await fetchProducts();
      await fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  const handleQuickStockAdjust = async (id, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await adminService.updateStock(id, {
        stockCount: newStock,
        inStock: newStock > 0
      });
      // Update local state instantly
      setProducts((prev) =>
        prev.map((p) => (p._id === id || p.id === id ? { ...p, stockCount: newStock, inStock: newStock > 0 } : p))
      );
      showToast(`Stock updated to ${newStock} units`);
      fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  const handleQuickRestockAI = async (id) => {
    try {
      await adminService.updateStock(id, {
        stockCount: 50,
        inStock: true
      });
      showToast('Restocked +50 units successfully!');
      await fetchDashboardData();
      await fetchProducts();
    } catch (err) {
      showToast(err.message || 'Restock failed', 'error');
    }
  };

  // ----------------------------------------------------
  // Order Handlers
  // ----------------------------------------------------
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      showToast(`Order status changed to ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSaveAdminPhone = (e) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    const cleaned = whatsappService.cleanPhone(phoneInput);
    whatsappService.setAdminPhone(cleaned);
    setAdminPhone(cleaned);
    setPhoneModalOpen(false);
    showToast(`Store WhatsApp phone updated to +${cleaned}`);
  };

  // ----------------------------------------------------
  // User Handlers
  // ----------------------------------------------------
  const handleToggleUserRole = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'customer' : 'admin';
    if (!window.confirm(`Change ${targetUser.name}'s role to ${newRole.toUpperCase()}?`)) return;

    setUserActionLoading(true);
    try {
      await adminService.updateUserRole(targetUser._id, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
      );
      showToast(`User role updated to ${newRole}`);
      fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to update role', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.email})?`)) return;

    setUserActionLoading(true);
    try {
      await adminService.deleteUser(targetUser._id);
      setUsersList((prev) => prev.filter((u) => u._id !== targetUser._id));
      showToast(`User account deleted successfully`);
      fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleCreateNewAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminForm.name.trim() || !newAdminForm.email.trim() || !newAdminForm.password.trim()) {
      showToast('Name, email, and password are required', 'error');
      return;
    }

    setUserActionLoading(true);
    try {
      await adminService.createAdminUser(newAdminForm);
      showToast(`Administrator "${newAdminForm.name}" created successfully!`);
      setCreateAdminModalOpen(false);
      setNewAdminForm({ name: '', email: '', password: '', phone: '' });
      await fetchUsers();
      await fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to create administrator', 'error');
    } finally {
      setUserActionLoading(false);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const filteredOrders = orders.filter((o) => {
    const customerName = o.user?.name || '';
    const customerEmail = o.user?.email || '';
    const orderId = o._id || '';
    const matchesSearch =
      orderId.toLowerCase().includes(orderSearch.toLowerCase()) ||
      customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      customerEmail.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = usersList.filter((u) => {
    const name = u.name || '';
    const email = u.email || '';
    return name.toLowerCase().includes(userSearch.toLowerCase()) || email.toLowerCase().includes(userSearch.toLowerCase());
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <p className="text-slate-500 font-medium">Loading SmartMart Admin Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'error' ? <X className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toast.msg}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Admin Control Center
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live System
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Signed in as <strong className="text-slate-700">{user?.name}</strong> ({user?.email})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {/* WhatsApp Admin Phone Config */}
            <button
              onClick={() => {
                setPhoneInput(adminPhone);
                setPhoneModalOpen(true);
              }}
              className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Configure Store Admin WhatsApp Phone Number"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
              <span className="hidden md:inline">WhatsApp:</span>
              <span className="font-mono font-bold">+{adminPhone}</span>
            </button>

            <button
              onClick={() => {
                fetchDashboardData();
                fetchProducts();
                fetchOrders();
                fetchUsers();
              }}
              disabled={refreshing}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="px-3.5 py-2 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
            >
              View Storefront
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'products', label: `Products (${products.length})`, icon: Package },
              { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
              { id: 'users', label: `Users (${usersList.length})`, icon: Users },
              { id: 'analytics', label: 'AI Analytics', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW                                                   */}
        {/* ================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* Total Revenue */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    ₹
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    ₹{stats.summary.totalRevenue.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-3 h-3" /> +18.4%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Excludes cancelled orders</p>
              </div>

              {/* Total Orders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Orders
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {stats.summary.totalOrders}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {stats.orderStatuses['Pending'] || 0} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats.orderStatuses['Delivered'] || 0} successfully delivered
                </p>
              </div>

              {/* Total Products */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Products
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {stats.summary.totalProducts}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {stats.summary.inStockProducts} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats.summary.outOfStockProducts} out of stock
                </p>
              </div>

              {/* Total Users */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Users
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {stats.summary.totalUsers}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Platform customer accounts</p>
              </div>
            </div>

            {/* Urgent Low Stock Warning Banner */}
            {stats.aiAnalytics.lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      Inventory Alert: {stats.aiAnalytics.lowStockProducts.length} Products Low in Stock!
                    </h3>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Items have fallen under threshold stock (≤10 units). Restock recommended.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm self-stretch sm:self-auto"
                >
                  View Low Stock Alerts
                </button>
              </div>
            )}

            {/* Middle Section: 7-Day Revenue Trend & Order Fulfillment Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 7-Day Revenue Visual Chart */}
              <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">7-Day Sales &amp; Revenue Trend</h3>
                    <p className="text-xs text-slate-500">Daily gross revenue over past week</p>
                  </div>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                    Weekly
                  </span>
                </div>

                {/* SVG / HTML Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
                  {stats.salesTrend.map((day, idx) => {
                    const maxRevenue = Math.max(
                      ...stats.salesTrend.map((d) => d.revenue),
                      1000
                    );
                    const heightPercent = Math.max(8, Math.round((day.revenue / maxRevenue) * 100));

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md whitespace-nowrap pointer-events-none z-20">
                          ₹{day.revenue.toLocaleString()} ({day.orders} orders)
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                        />
                        {/* Label */}
                        <span className="text-[11px] font-bold text-slate-500">{day.day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-1">
                  <span>Last 7 Days</span>
                  <span className="font-semibold text-slate-600">
                    Total: ₹{stats.salesTrend.reduce((acc, d) => acc + d.revenue, 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Status Distribution */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Order Fulfillment</h3>
                  <p className="text-xs text-slate-500 mb-5">Current orders status distribution</p>

                  <div className="space-y-3.5">
                    {[
                      { status: 'Delivered', count: stats.orderStatuses['Delivered'] || 0, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                      { status: 'Processing', count: stats.orderStatuses['Processing'] || 0, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
                      { status: 'Out for Delivery', count: stats.orderStatuses['Out for Delivery'] || 0, color: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50' },
                      { status: 'Pending', count: stats.orderStatuses['Pending'] || 0, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
                      { status: 'Cancelled', count: stats.orderStatuses['Cancelled'] || 0, color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' }
                    ].map((item, i) => {
                      const total = stats.summary.totalOrders || 1;
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>{item.status}</span>
                            <span className="text-slate-500">{item.count} orders ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('orders')}
                  className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 text-center transition-colors"
                >
                  Manage All Orders &rarr;
                </button>
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Recent Customer Orders</h3>
                  <p className="text-xs text-slate-500">Latest transactions received</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  View All ({orders.length}) &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Items</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {stats.recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No orders placed yet.
                        </td>
                      </tr>
                    ) : (
                      stats.recentOrders.map((ord) => (
                        <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-brand-600">
                            #{ord._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-bold text-slate-800">{ord.user?.name || 'Customer'}</p>
                            <p className="text-[11px] text-slate-400">{ord.user?.email || '-'}</p>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {ord.orderItems?.length || 1} items
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            ₹{ord.totalAmount?.toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeClass(
                                ord.status
                              )}`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: PRODUCT MANAGEMENT                                         */}
        {/* ================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Action Bar: Search, Category Filter, and Add Product */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="grocery">Grocery</option>
                  <option value="dairy">Dairy</option>
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="snacks">Snacks</option>
                  <option value="beverages">Beverages</option>
                </select>
              </div>

              {/* Add Product Button */}
              <button
                onClick={handleOpenCreateProduct}
                className="w-full md:w-auto px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand-500/25 transition-all hover:shadow-lg"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-4 text-center">Manage Stock</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No products found matching your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const pid = p._id || p.id;
                        const stock = p.stockCount !== undefined ? p.stockCount : 50;
                        const isLowStock = stock <= 10;

                        return (
                          <tr key={pid} className="hover:bg-slate-50/60 transition-colors">
                            {/* Product Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-12 h-12 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{p.unit}</p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-3">
                              <span className="capitalize px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                {p.category}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-3 font-bold text-slate-900 text-sm">
                              ₹{p.price}
                              {p.originalPrice > p.price && (
                                <span className="line-through text-slate-400 text-xs block font-normal">
                                  ₹{p.originalPrice}
                                </span>
                              )}
                            </td>

                            {/* Stock Stepper */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                                <button
                                  onClick={() => handleQuickStockAdjust(pid, stock, -5)}
                                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                                  title="-5 stock"
                                >
                                  -
                                </button>
                                <span
                                  className={`w-12 text-center font-mono font-bold text-xs ${
                                    isLowStock ? 'text-rose-600' : 'text-slate-800'
                                  }`}
                                >
                                  {stock}
                                </span>
                                <button
                                  onClick={() => handleQuickStockAdjust(pid, stock, 5)}
                                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                                  title="+5 stock"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-3">
                              {p.inStock && stock > 0 ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  In Stock
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Out of Stock
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(pid, p.name)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: ORDER MANAGEMENT                                           */}
        {/* ================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order ID or customer..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Items</th>
                      <th className="py-3 px-3">Total Amount</th>
                      <th className="py-3 px-4">Fulfillment Status</th>
                      <th className="py-3 px-3 text-center">Customer WhatsApp</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No orders found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                            #{ord._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-slate-900">{ord.shippingAddress?.fullName || ord.user?.name || 'Customer'}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              {ord.shippingAddress?.phone || ord.user?.phone || ord.user?.email || '-'}
                            </p>
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {ord.orderItems?.length || 1} items
                          </td>
                          <td className="py-3.5 px-3 font-bold text-slate-900 text-sm">
                            ₹{(ord.totalPrice || ord.totalAmount || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={ord.status}
                              disabled={updatingOrderId === ord._id}
                              onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                                ord.status
                              )}`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {whatsappService.cleanPhone(ord.shippingAddress?.phone || ord.user?.phone) ? (
                              <button
                                onClick={() => whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(ord))}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                title={`Chat with ${ord.shippingAddress?.fullName || ord.user?.name || 'Customer'} on WhatsApp`}
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                                <span>Deal on WhatsApp</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No phone</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: USER MANAGEMENT                                            */}
        {/* ================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search Bar & Actions */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <p className="text-xs text-slate-500 font-medium">
                  Total Accounts: <strong>{usersList.length}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setCreateAdminModalOpen(true)}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-98 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Add Administrator</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-3">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isCurrentAdmin = u._id === user?._id;
                        return (
                          <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
                                  {u.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                    {u.name}
                                    {isCurrentAdmin && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                        You
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-slate-500">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              {u.role === 'admin' ? (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Admin
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  Customer
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-slate-600">
                              {u.phone || '-'}
                            </td>

                            <td className="py-3.5 px-3 text-slate-500">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleUserRole(u)}
                                  disabled={userActionLoading || isCurrentAdmin}
                                  className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
                                  title="Toggle Admin / Customer Role"
                                >
                                  {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={userActionLoading || isCurrentAdmin}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: AI ANALYTICS                                               */}
        {/* ================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Low Stock Alerts & Quick Restock Section */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Low Stock Inventory Alerts</h3>
                    <p className="text-xs text-slate-500">Products requiring immediate restock</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  {stats.aiAnalytics.lowStockProducts.length} Items Alerting
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {stats.aiAnalytics.lowStockProducts.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-slate-400 text-sm">
                    All products are adequately stocked!
                  </div>
                ) : (
                  stats.aiAnalytics.lowStockProducts.map((item) => (
                    <div
                      key={item._id}
                      className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-xl border border-amber-200 bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                          <p className="text-xs text-slate-500">{item.unit} • ₹{item.price}</p>
                          <p className="text-xs font-extrabold text-rose-600 mt-1">
                            Only {item.stockCount} left in stock
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickRestockAI(item._id)}
                        className="mt-3.5 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                      >
                        Quick Restock (+50 Units)
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Recommended Products & Trending Searches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Recommended Products */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">AI Top Recommended Products</h3>
                    <p className="text-xs text-slate-500">Highest affinity and customer satisfaction</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {stats.aiAnalytics.mostRecommended.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-extrabold text-slate-400">
                          #{idx + 1}
                        </span>
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-100 bg-slate-50 shrink-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{p.name}</p>
                          <p className="text-[11px] text-slate-500">{p.unit} • ₹{p.price}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ★ {p.rating}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.stockCount} in stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Searches */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Trending Customer Searches</h3>
                    <p className="text-xs text-slate-500">Most frequent grocery search queries</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {stats.aiAnalytics.popularSearches.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">"{s.tag}"</p>
                          <span className="text-[10px] font-semibold text-brand-600 uppercase">
                            {s.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700">{s.count} searches</span>
                        <p className="text-[10px] font-bold text-emerald-600">{s.growth}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* PRODUCT CREATE / EDIT MODAL                                         */}
      {/* =================================================================== */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 mt-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  placeholder="e.g. Amul Fresh Milk 1L"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="grocery">Grocery</option>
                    <option value="dairy">Dairy</option>
                    <option value="fruits">Fruits</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="snacks">Snacks</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit / Weight *</label>
                  <input
                    type="text"
                    required
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. 1 kg, 500ml, 6 pcs"
                  />
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sale Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Stock Count & Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Count</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stockCount}
                    onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={productForm.badge}
                    onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    placeholder="e.g. Popular, Farm Fresh"
                  />
                </div>
              </div>

              {/* Image Upload & Live Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Image</label>
                <div className="flex items-center gap-3">
                  <img
                    src={productForm.image}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 bg-slate-50 shrink-0"
                  />
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                      <Camera className="w-3.5 h-3.5 text-brand-600" />
                      <span>{uploadingImage ? 'Uploading...' : 'Choose Device Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="Or paste direct image URL"
                      className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  placeholder="Short description of the item..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productActionLoading || uploadingImage}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {productActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProductId ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ORDER DETAILS MODAL                                                 */}
      {/* =================================================================== */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Order Details #{selectedOrderDetails._id.slice(-6).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Customer Info */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase">Customer Information</h4>
                  {whatsappService.cleanPhone(selectedOrderDetails.shippingAddress?.phone || selectedOrderDetails.user?.phone) && (
                    <button
                      type="button"
                      onClick={() =>
                        whatsappService.openWhatsApp(
                          whatsappService.getCustomerChatUrl(selectedOrderDetails)
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3 h-3 fill-[#25D366]" />
                      <span>Chat on WhatsApp</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-900 font-bold">
                  {selectedOrderDetails.shippingAddress?.fullName || selectedOrderDetails.user?.name || 'Customer'}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  📞 {selectedOrderDetails.shippingAddress?.phone || selectedOrderDetails.user?.phone || 'No phone provided'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  ✉️ {selectedOrderDetails.user?.email || 'No email'}
                </p>
                {selectedOrderDetails.shippingAddress && (
                  <p className="text-xs text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/60">
                    📍 {selectedOrderDetails.shippingAddress.address},{' '}
                    {selectedOrderDetails.shippingAddress.city} -{' '}
                    {selectedOrderDetails.shippingAddress.postalCode}
                  </p>
                )}
              </div>

              {/* WhatsApp Quick Deal & Customer Alerts */}
              {whatsappService.cleanPhone(selectedOrderDetails.shippingAddress?.phone || selectedOrderDetails.user?.phone) && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                    </div>
                    <span className="text-xs font-bold text-emerald-950">Quick WhatsApp Customer Alerts</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const custName = selectedOrderDetails.shippingAddress?.fullName || selectedOrderDetails.user?.name || 'Valued Customer';
                        const ordShort = selectedOrderDetails._id.slice(-6).toUpperCase();
                        const msg = `Hello *${custName}*! 🚴 Your SmartMart AI order *#${ordShort}* is packed and OUT FOR DELIVERY! Our rider will reach your doorstep in 10-15 minutes.`;
                        whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(selectedOrderDetails, msg));
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Out for Delivery</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const custName = selectedOrderDetails.shippingAddress?.fullName || selectedOrderDetails.user?.name || 'Valued Customer';
                        const ordShort = selectedOrderDetails._id.slice(-6).toUpperCase();
                        const msg = `Hello *${custName}*! 🎉 Your SmartMart AI order *#${ordShort}* has been successfully DELIVERED. Thank you for shopping with us!`;
                        whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(selectedOrderDetails, msg));
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Delivered Alert</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const custName = selectedOrderDetails.shippingAddress?.fullName || selectedOrderDetails.user?.name || 'Valued Customer';
                        const ordShort = selectedOrderDetails._id.slice(-6).toUpperCase();
                        const msg = `Hi *${custName}*, our delivery partner is in your area for order *#${ordShort}*. Could you please share a nearby landmark or live location? Thank you!`;
                        whatsappService.openWhatsApp(whatsappService.getCustomerChatUrl(selectedOrderDetails, msg));
                      }}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-100/70 border border-emerald-200 text-emerald-900 text-[11px] font-bold text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ask Landmark</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Ordered Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Items Ordered</h4>
                <div className="space-y-2">
                  {selectedOrderDetails.orderItems?.map((item, idx) => {
                    const qty = item.qty || item.quantity || 1;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[11px] text-slate-500">Qty: {qty} {item.unit ? `(${item.unit})` : ''}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">
                          ₹{(item.price * qty).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary */}
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-brand-600">
                  ₹{(selectedOrderDetails.totalPrice || selectedOrderDetails.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ADMIN WHATSAPP PHONE NUMBER CONFIG MODAL                            */}
      {/* =================================================================== */}
      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Admin WhatsApp Number</h3>
                  <p className="text-xs text-slate-500">Where customer order notifications are sent</p>
                </div>
              </div>
              <button
                onClick={() => setPhoneModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminPhone} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Phone Number (with Country Code)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="e.g. 919876543210 or 9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter with country code (e.g. 91 for India). Standard 10-digit numbers will auto-prefix 91.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  How WhatsApp Order Alerts Work:
                </p>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  When a customer checks out, order items, customer address, and price are pre-formatted for direct WhatsApp communication, so you can confirm and dispatch immediately!
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPhoneModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Phone Number</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE NEW ADMINISTRATOR MODAL                                      */}
      {/* =================================================================== */}
      {createAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Administrator</h3>
                  <p className="text-xs text-slate-500">Create staff account with full control access</p>
                </div>
              </div>
              <button
                onClick={() => setCreateAdminModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewAdmin} className="space-y-3.5 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrator Email *</label>
                <input
                  type="email"
                  required
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                  placeholder="sarah@smartmart.ai"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newAdminForm.phone}
                    onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                    placeholder="+91 99999 11111"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  Admin Privileges Granted
                </span>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  This user will have full access to add products, adjust stock, manage orders, and modify store configurations.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateAdminModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userActionLoading}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-70"
                >
                  {userActionLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Create Administrator</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

