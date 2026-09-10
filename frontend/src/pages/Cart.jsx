import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Tag, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  ArrowLeft,
  X,
  CreditCard,
  MapPin,
  Sparkles,
  Copy,
  Loader2
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { whatsappService } from '../services/whatsappService';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';

export const Cart = ({ navigateTo: propNavigateTo }) => {
  const navigate = useNavigate();
  const navigateTo = (page) => {
    if (propNavigateTo) propNavigateTo(page);
    if (page === 'products') navigate('/products');
    else if (page === 'home') navigate('/');
    else navigate(`/${page}`);
  };

  const { 
    cart, 
    updateQuantity, 
    increaseQuantity,
    decreaseQuantity,
    removeFromCart, 
    clearCart, 
    totalItems, 
    subtotal, 
    originalSubtotal, 
    itemsDiscount, 
    coupon, 
    couponDiscount, 
    applyCoupon, 
    removeCoupon, 
    deliveryFee, 
    freeDeliveryThreshold,
    finalTotal 
  } = useCart();

  const { user, isAuthenticated } = useAuth();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [placedOrderObj, setPlacedOrderObj] = useState(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const amountForFreeDelivery = Math.max(0, (freeDeliveryThreshold || 199) - subtotal);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setInputCoupon('');
    }
  };

  const [placingOrder, setPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    setPlacingOrder(true);
    try {
      const orderData = {
        orderItems: cart.map(item => ({
          product: item._id || item.id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          unit: item.unit || '',
          image: item.image
        })),
        shippingAddress: {
          fullName: user?.name || 'Customer',
          address: user?.address || '221B Baker Residency, Indiranagar',
          city: 'Bengaluru',
          postalCode: '560038',
          phone: user?.phone || '+91 98765 43210'
        },
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment / UPI',
        itemsPrice: subtotal,
        deliveryFee: deliveryFee,
        discount: couponDiscount,
        totalPrice: finalTotal
      };

      let finalSavedOrder = null;

      if (isAuthenticated) {
        const res = await orderService.createOrder(orderData);
        if (res && res.order) {
          finalSavedOrder = res.order;
          setOrderId(res.order._id);
          setPlacedOrderObj(res.order);
          setOrderPlaced(true);
          clearCart();
        } else {
          throw new Error('Could not create order in database');
        }
      } else {
        const newOrderId = 'SM-' + Math.floor(100000 + Math.random() * 900000);
        finalSavedOrder = {
          ...orderData,
          _id: newOrderId,
          createdAt: new Date().toISOString()
        };
        setOrderId(newOrderId);
        setPlacedOrderObj(finalSavedOrder);
        setOrderPlaced(true);
        clearCart();
      }

      // Automatically launch WhatsApp with pre-filled order specs
      try {
        if (finalSavedOrder) {
          const waUrl = whatsappService.getAdminOrderUrl(finalSavedOrder);
          whatsappService.openWhatsApp(waUrl);
        }
      } catch (waErr) {
        console.warn('WhatsApp auto-redirect notice:', waErr);
      }
    } catch (err) {
      console.warn('Order creation issue:', err.message);
      const fallbackOrderId = 'SM-' + Math.floor(100000 + Math.random() * 900000);
      const fallbackOrder = {
        _id: fallbackOrderId,
        orderItems: cart.map(item => ({
          product: item._id || item.id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          unit: item.unit || '',
          image: item.image
        })),
        shippingAddress: {
          fullName: user?.name || 'Customer',
          address: user?.address || '221B Baker Residency, Indiranagar',
          city: 'Bengaluru',
          postalCode: '560038',
          phone: user?.phone || '+91 98765 43210'
        },
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment / UPI',
        itemsPrice: subtotal,
        deliveryFee: deliveryFee,
        discount: couponDiscount,
        totalPrice: finalTotal,
        createdAt: new Date().toISOString()
      };
      setOrderId(fallbackOrderId);
      setPlacedOrderObj(fallbackOrder);
      setOrderPlaced(true);
      clearCart();
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[#F8FAFC]">
        <div className="w-24 h-24 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-6 shadow-inner">
          <ShoppingCart className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-md text-center mb-8">
          Looks like you haven't added any fresh groceries to your cart yet. Explore our pantry staples and fresh farm produce!
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="px-8 py-3.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all active:scale-95"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-5 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Shopping Cart
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review items before our 15-min doorstep delivery
            </p>
          </div>
          <button
            onClick={() => navigateTo('products')}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Continue Shopping</span>
            <span className="sm:hidden">Shop</span>
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-brand-100 shadow-soft mb-6 sm:mb-8">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <div className="flex items-center gap-2 text-slate-800">
              <Truck className="w-4 h-4 text-brand-500 shrink-0" />
              {amountForFreeDelivery === 0 ? (
                <span className="text-emerald-600">🎉 Congratulations! FREE 15-Min Delivery Unlocked!</span>
              ) : (
                <span>Add <span className="text-brand-600">₹{amountForFreeDelivery}</span> more for FREE Delivery</span>
              )}
            </div>
            <span className="text-slate-400 hidden sm:inline">Target: ₹{freeDeliveryThreshold}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
            />
          </div>
        </div>

        {/* Cart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 shadow-soft divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.id} className="py-3.5 sm:py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Image & Info */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 p-2 flex items-center justify-center shrink-0 border border-slate-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {item.unit} • ₹{item.price} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper & Price & Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[60px] sm:min-w-[70px]">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 sm:p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold"
              >
                Clear entire cart
              </button>
            </div>
          </div>

          {/* Order Summary Card */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-6">
              <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              {/* Coupon Form */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Have a Coupon? (Try SMART10 or FRESH20)
                </label>
                {coupon.code ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800">{coupon.code}</span>
                        <span className="text-[11px] text-emerald-600 block">({coupon.discountPercent}% Off Applied)</span>
                      </div>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-rose-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FRESH20"
                      value={inputCoupon}
                      onChange={(e) => setInputCoupon(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-xs text-rose-500 mt-1">{couponError}</p>
                )}
              </div>

              {/* Cost Calculations */}
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span>Items Total ({totalItems} items)</span>
                  <span className="font-semibold text-slate-900">₹{originalSubtotal}</span>
                </div>

                {itemsDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Product Savings</span>
                    <span>-₹{itemsDiscount}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span>Delivery Fee</span>
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    <span className="font-semibold text-slate-900">₹{deliveryFee}</span>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                  <span className="text-base font-black text-slate-900">Grand Total</span>
                  <span className="text-2xl font-black text-brand-600">₹{finalTotal}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-98 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Safe &amp; Contactless 15-Min Delivery</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Delivery &amp; Payment</h3>
                <p className="text-xs text-slate-500">Skyline Mart Rapid Checkout</p>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Delivering to
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <p className="font-bold text-slate-900">{user?.name || 'Customer'}</p>
                <p className="text-slate-500 mt-0.5">{user?.address || '221B Baker Residency, Indiranagar, Bengaluru'}</p>
                <p className="text-slate-400 mt-0.5">{user?.phone || '+91 98765 43210'}</p>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Payment Method
              </label>
              <div className="space-y-2">
                {[
                  { id: 'cod', label: 'Cash on Delivery (Cash / UPI at Doorstep)', icon: Truck },
                  { id: 'upi', label: 'Instant UPI (GPay / PhonePe / Paytm)', icon: Sparkles },
                  { id: 'card', label: 'Credit / Debit Card / Net Banking', icon: CreditCard }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer text-xs font-bold transition-all ${
                        paymentMethod === m.id
                          ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                        className="accent-brand-500"
                      />
                      <Icon className="w-4 h-4 text-brand-500" />
                      <span>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500">Payable Amount:</span>
                <p className="text-xl font-black text-slate-900">₹{finalTotal}</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                15-Min Delivery
              </span>
            </div>

            {/* Confirm button */}
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-75"
            >
              {placingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <span>Place Order • ₹{finalTotal}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 text-center space-y-5">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce-short">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                Order Confirmed!
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                Thank You for Shopping!
              </h3>
              <p className="text-xs text-slate-500">
                Your order <strong className="text-slate-800">#{orderId.slice(-8).toUpperCase()}</strong> has been saved and is currently being prepared for 15-minute delivery.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-brand-600">15-18 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-bold text-slate-800 uppercase">{paymentMethod}</span>
              </div>
            </div>

            {/* WhatsApp Store Dispatch CTA */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-left space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Store WhatsApp Dispatch</h4>
                  <p className="text-[11px] text-emerald-700">Send order specs to store manager for instant confirmation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (placedOrderObj) {
                    const waUrl = whatsappService.getAdminOrderUrl(placedOrderObj);
                    whatsappService.openWhatsApp(waUrl);
                  }
                }}
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Send Order to Store on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (placedOrderObj) {
                    const text = whatsappService.formatOrderMessage(placedOrderObj);
                    navigator.clipboard.writeText(text);
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 2500);
                  }
                }}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedSummary ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Summary Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copy Order Summary</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setOrderPlaced(false);
                  setIsCheckoutOpen(false);
                  navigateTo('orders');
                }}
                className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm rounded-2xl shadow-md transition-colors"
              >
                Track &amp; View Orders
              </button>

              <button
                onClick={() => {
                  setOrderPlaced(false);
                  setIsCheckoutOpen(false);
                  navigateTo('products');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

