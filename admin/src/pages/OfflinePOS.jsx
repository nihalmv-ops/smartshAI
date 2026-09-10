import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  RotateCcw,
  ShoppingBag,
  Loader2,
  User,
  Phone,
  Barcode,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { posService } from '../services/posService';
import { categoryService, defaultCategories } from '../services/categoryService';
import { AdminHeader } from '../components/layout/AdminHeader';

export const OfflinePOS = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // POS Cart State
  const [cart, setCart] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Shift & Status
  const [shiftSummary, setShiftSummary] = useState({ totalShiftSales: 0, totalTransactions: 0, paymentTotals: {} });
  const [submittingSale, setSubmittingSale] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  const searchInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, catData, shiftData] = await Promise.allSettled([
        posService.getProducts(searchQuery, selectedCategory),
        categoryService.getAllCategories(),
        posService.getShiftSummary()
      ]);

      if (prodData.status === 'fulfilled' && prodData.value?.products) {
        setProducts(prodData.value.products);
      }
      if (catData.status === 'fulfilled' && catData.value && catData.value.length > 0) {
        setCategories(catData.value);
      }
      if (shiftData.status === 'fulfilled') {
        setShiftSummary(shiftData.value);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load POS data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  // Search debounce or enter trigger
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await posService.getProducts(searchQuery, selectedCategory);
      if (res && res.products) {
        setProducts(res.products);
        // If exact barcode match found 1 item, auto-add to cart
        if (res.products.length === 1 && searchQuery.trim().length > 3) {
          addToCart(res.products[0]);
          setSearchQuery('');
        }
      }
    } catch (err) {
      console.warn('Search query error:', err);
    }
  };

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      if (existing.qty >= (product.stockCount || 50)) {
        showToast(`Cannot add more. Only ${product.stockCount} available in stock.`, 'error');
        return;
      }
      setCart(cart.map((item) => (item._id === product._id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    showToast(`Added "${product.name}" to bill`);
  };

  const updateCartQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const prod = products.find((p) => p._id === productId);
    if (prod && newQty > (prod.stockCount || 50)) {
      showToast(`Only ${prod.stockCount} units in stock`, 'error');
      return;
    }
    setCart(cart.map((item) => (item._id === productId ? { ...item, qty: newQty } : item)));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setAmountTendered('');
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price || 0) * (item.qty || 1), 0);
  const safeDiscount = Math.min(Number(discountAmount) || 0, subtotal);
  const finalTotal = Math.max(0, subtotal - safeDiscount);
  const tenderedNum = Number(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - finalTotal);

  // Submit sale transaction
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      showToast('Please add items to cart before checking out', 'error');
      return;
    }

    if (paymentMethod === 'Cash' && tenderedNum > 0 && tenderedNum < finalTotal) {
      showToast('Amount tendered is less than the payable total', 'error');
      return;
    }

    setSubmittingSale(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product: item._id,
          name: item.name,
          qty: item.qty,
          price: item.price,
          category: item.category,
          unit: item.unit
        })),
        paymentMethod,
        discount: safeDiscount,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        amountTendered: tenderedNum || finalTotal,
        notes: notes.trim()
      };

      const res = await posService.createSale(payload);
      if (res && res.receipt) {
        setCompletedReceipt(res.receipt);
        clearCart();
        showToast('Sale completed successfully!');
        // Refresh shift summary & products
        posService.getShiftSummary().then(setShiftSummary);
        posService.getProducts(searchQuery, selectedCategory).then((r) => r?.products && setProducts(r.products));
      }
    } catch (err) {
      showToast(err.message || 'Failed to complete sale', 'error');
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-100">
      <AdminHeader
        title="Offline Store POS Counter"
        subtitle="Rapid in-store checkout, barcode scanning, live stock deduction, and receipt printing"
        onRefresh={loadData}
        refreshing={loading}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-xl border flex items-center gap-2 text-xs font-semibold animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Shift Overview Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Today's Shift:
            </span>
            <span className="text-slate-800 font-bold">
              ₹{shiftSummary.totalShiftSales?.toLocaleString() || 0} Total (
              {shiftSummary.totalTransactions || 0} bills)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold">
              💵 Cash: ₹{shiftSummary.paymentTotals?.Cash?.toLocaleString() || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-bold">
              📱 UPI: ₹{shiftSummary.paymentTotals?.UPI?.toLocaleString() || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold">
              💳 Card: ₹{shiftSummary.paymentTotals?.Card?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      <main className="p-3 sm:p-5 max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (Catalog & Search): 7 Cols */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* Search & Barcode Bar */}
          <form onSubmit={handleSearchSubmit} className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode, or search product name / SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.slug || c.id}
                onClick={() => setSelectedCategory(c.slug || c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all capitalize cursor-pointer ${
                  selectedCategory === (c.slug || c.id)
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs overflow-y-auto max-h-[68vh]">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs">Loading store catalog...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                No items found for this query or category.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2.5">
                {products.map((p) => {
                  const stock = p.stockCount !== undefined ? p.stockCount : 50;
                  const inCart = cart.find((it) => it._id === p._id);

                  return (
                    <div
                      key={p._id}
                      onClick={() => addToCart(p)}
                      className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        inCart
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-emerald-400 hover:shadow-xs bg-white'
                      }`}
                    >
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-50 relative mb-2">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        {inCart && (
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] shadow-sm">
                            {inCart.qty} in bill
                          </span>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[10px] font-mono">
                          Stock: {stock}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.unit}</p>
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          ₹{p.price}
                        </span>
                        <button
                          type="button"
                          className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:bg-emerald-700 active:scale-90 transition-transform"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Live Bill & Checkout): 5 Cols */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4 space-y-3.5 max-h-[85vh] overflow-y-auto">
          {/* Bill Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Active Register Bill</h3>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Customer Details Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                placeholder="Walk-in"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none"
                placeholder="Mobile (optional)"
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto max-h-56 space-y-2 pr-1 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Cart is empty. Tap items or scan barcodes to add.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item._id} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-500">₹{item.price} each</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => updateCartQty(item._id, item.qty - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l-lg cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center font-bold font-mono text-slate-900 text-xs">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item._id, item.qty + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r-lg cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 text-xs w-14 text-right">
                      ₹{item.price * item.qty}
                    </span>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discount & Payment Method */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Discount (₹)</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-xs focus:outline-none"
                placeholder="0"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Payment Mode
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {['Cash', 'UPI', 'Card', 'Other'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Calculator if paymentMethod === Cash */}
            {paymentMethod === 'Cash' && (
              <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-amber-900 block">
                    Cash Received (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder={`₹${finalTotal}`}
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded-lg font-bold text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-900 block">Change Due</label>
                  <p className="text-sm font-black text-emerald-800 pt-1 font-mono">
                    ₹{changeDue.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Bill Totals Summary */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cart.reduce((a, b) => a + b.qty, 0)} items)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {safeDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount Applied</span>
                  <span>-₹{safeDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline font-black text-slate-900">
                <span className="text-sm">Payable Total:</span>
                <span className="text-lg text-emerald-700 font-mono">₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Complete Sale Action */}
            <button
              type="button"
              disabled={submittingSale || cart.length === 0}
              onClick={handleCompleteSale}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submittingSale ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Sale...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Sale • ₹{finalTotal.toLocaleString()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Printable Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
              <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                Skyline Mart
              </h2>
              <p className="text-[11px] text-slate-500">Fresh Supermarket &amp; Pantry</p>
              <p className="text-[10px] text-slate-400">Indiranagar, Bengaluru - 560038</p>
              <p className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                Receipt #{completedReceipt.receiptNumber}
              </p>
              <p className="text-[10px] text-slate-400">
                {new Date(completedReceipt.createdAt).toLocaleString()} | Cashier:{' '}
                {completedReceipt.cashier}
              </p>
            </div>

            <div className="space-y-1 text-xs max-h-48 overflow-y-auto divide-y divide-dashed divide-slate-200">
              {completedReceipt.items.map((it, idx) => (
                <div key={idx} className="pt-1 flex justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{it.name}</p>
                    <span className="text-[10px] text-slate-500">
                      {it.qty} × ₹{it.price}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">₹{it.price * it.qty}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{completedReceipt.subtotal}</span>
              </div>
              {completedReceipt.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-₹{completedReceipt.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>₹{completedReceipt.total}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>Paid via {completedReceipt.paymentMethod}:</span>
                <span>₹{completedReceipt.amountTendered}</span>
              </div>
              {completedReceipt.changeDue > 0 && (
                <div className="flex justify-between text-emerald-800 text-[11px]">
                  <span>Change Given:</span>
                  <span>₹{completedReceipt.changeDue}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400 italic">
              Thank you for shopping at Skyline Mart! Please visit again.
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sale</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflinePOS;
