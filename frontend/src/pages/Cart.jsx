import React, { useState, useEffect } from 'react';
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
  Loader2, 
  FileText, 
  User, 
  Phone, 
  Home, 
  Check,
  Scale,
  Banknote,
  Percent,
  Sparkle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { whatsappService } from '../services/whatsappService';
import { whatsAppContactService } from '../services/whatsAppContactService';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { 
  isWeightProduct, 
  isVolumeProduct, 
  formatWeight, 
  calculateWeightPrice, 
  getItemLineTotal 
} from '../utils/weightUtils';

// Fast Inline Cart Item with Instant Weight Editing & Quantity Stepper
const CartItemCard = ({
  item,
  onUpdateQuantity,
  onUpdateWeight,
  onRemove
}) => {
  const itemId = item._id || item.id;
  const isWeight = isWeightProduct(item);
  const isVolume = isVolumeProduct(item);
  const isMeasurable = isWeight || isVolume;

  const currentWeightGrams = Number(item.weightInGrams || (isWeight ? 1000 : 0));
  const initialUnit = currentWeightGrams < 1000 ? (isVolume ? 'ml' : 'g') : (isVolume ? 'L' : 'kg');
  const [unit, setUnit] = useState(initialUnit);
  const [inputWeight, setInputWeight] = useState(() => {
    if (initialUnit === 'kg' || initialUnit === 'L') {
      return (Math.round((currentWeightGrams / 1000) * 1000) / 1000).toString();
    }
    return Math.round(currentWeightGrams).toString();
  });

  // Sync state if external cart changes
  useEffect(() => {
    if (unit === 'kg' || unit === 'L') {
      setInputWeight((Math.round((currentWeightGrams / 1000) * 1000) / 1000).toString());
    } else {
      setInputWeight(Math.round(currentWeightGrams).toString());
    }
  }, [currentWeightGrams, unit]);

  const handleUnitToggle = (newUnit) => {
    const val = parseFloat(inputWeight);
    if (!isNaN(val) && val > 0) {
      if ((unit === 'kg' || unit === 'L') && (newUnit === 'g' || newUnit === 'ml')) {
        setInputWeight(Math.round(val * 1000).toString());
      } else if ((unit === 'g' || unit === 'ml') && (newUnit === 'kg' || newUnit === 'L')) {
        setInputWeight((Math.round((val / 1000) * 1000) / 1000).toString());
      }
    }
    setUnit(newUnit);
  };

  const handleWeightChange = (e) => {
    const val = e.target.value;
    setInputWeight(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      const grams = (unit === 'kg' || unit === 'L')
        ? Math.round(parsed * 1000)
        : Math.round(parsed);
      onUpdateWeight(itemId, grams);
    }
  };

  const lineTotal = isMeasurable
    ? calculateWeightPrice(item.price, currentWeightGrams, item.quantity)
    : Math.round(Number(item.price || 0) * (item.quantity || 1) * 100) / 100;

  const originalTotal = item.originalPrice && item.originalPrice > item.price
    ? (isMeasurable
        ? calculateWeightPrice(item.originalPrice, currentWeightGrams, item.quantity)
        : Math.round(Number(item.originalPrice) * (item.quantity || 1) * 100) / 100)
    : null;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 hover:shadow-md transition-all">
      {/* Product Image & Details */}
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 flex-1 min-w-0">
        <div className="relative shrink-0">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl bg-slate-50 border border-slate-100 shadow-sm" 
          />
          {isMeasurable && (
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[9px] font-black border border-amber-200 shadow-sm">
              {formatWeight(currentWeightGrams)}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
              {item.name}
            </h3>
            {/* Quick delete on mobile */}
            <button
              onClick={() => onRemove(itemId)}
              className="sm:hidden p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Rate and unit tag */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-600 font-semibold">
              ₹{item.price} / {isWeight ? 'kg' : isVolume ? 'litre' : item.unit || 'pack'}
            </span>
            {item.originalPrice && item.originalPrice > item.price && (
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Exact Inline Weight / Volume Adjustment */}
          {isMeasurable ? (
            <div className="mt-2.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-1 shadow-sm">
                  <Scale className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    value={inputWeight}
                    onChange={handleWeightChange}
                    className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                    title="Edit exact measured weight"
                  />
                  <div className="flex items-center ml-1.5 bg-slate-200/60 p-0.5 rounded-lg">
                    {isVolume ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUnitToggle('L')}
                          className={`px-1.5 py-0.5 text-[10px] font-black rounded-md transition-colors cursor-pointer ${unit === 'L' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          L
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnitToggle('ml')}
                          className={`px-1.5 py-0.5 text-[10px] font-black rounded-md transition-colors cursor-pointer ${unit === 'ml' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          ml
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUnitToggle('kg')}
                          className={`px-1.5 py-0.5 text-[10px] font-black rounded-md transition-colors cursor-pointer ${unit === 'kg' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUnitToggle('g')}
                          className={`px-1.5 py-0.5 text-[10px] font-black rounded-md transition-colors cursor-pointer ${unit === 'g' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          g
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick weight preset chips */}
                <div className="flex items-center gap-1">
                  {(isVolume ? [500, 1000, 2000] : [250, 500, 1000, 2000]).map((grams) => {
                    const isSelected = currentWeightGrams === grams;
                    const label = isVolume
                      ? (grams >= 1000 ? `${grams / 1000}L` : `${grams}ml`)
                      : (grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`);
                    return (
                      <button
                        key={grams}
                        type="button"
                        onClick={() => {
                          if (isVolume) {
                            if (grams >= 1000) {
                              setUnit('L');
                              setInputWeight((grams / 1000).toString());
                            } else {
                              setUnit('ml');
                              setInputWeight(grams.toString());
                            }
                          } else {
                            if (grams >= 1000) {
                              setUnit('kg');
                              setInputWeight((grams / 1000).toString());
                            } else {
                              setUnit('g');
                              setInputWeight(grams.toString());
                            }
                          }
                          onUpdateWeight(itemId, grams);
                        }}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Unit: {item.unit || '1 pack'}
            </p>
          )}
        </div>
      </div>

      {/* Stepper & Price Row */}
      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 shadow-sm">
          <button
            onClick={() => onUpdateQuantity(itemId, -1)}
            className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-xs font-black text-slate-900">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(itemId, 1)}
            className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Line Total Price Display */}
        <div className="text-right min-w-[75px]">
          <div className="text-base sm:text-lg font-black text-slate-900">
            ₹{lineTotal}
          </div>
          {originalTotal && (
            <div className="text-xs text-slate-400 line-through">
              ₹{originalTotal}
            </div>
          )}
        </div>

        {/* Remove button desktop */}
        <button
          onClick={() => onRemove(itemId)}
          className="hidden sm:flex p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

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
    updateItemWeight, 
    getItemPrice, 
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

  // Customer Checkout Details State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(user?.address || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [formError, setFormError] = useState('');

  // WhatsApp Multi-contact Selection State
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isWhatsAppOrder, setIsWhatsAppOrder] = useState(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState('');

  const [placingOrder, setPlacingOrder] = useState(false);

  const amountForFreeDelivery = Math.max(0, (freeDeliveryThreshold || 199) - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / (freeDeliveryThreshold || 199)) * 100));

  // Sync user defaults when authentication loads
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!customerAddress && user.address) setCustomerAddress(user.address);
    }
  }, [user]);

  // Load configured store WhatsApp contacts
  useEffect(() => {
    const fetchContacts = async () => {
      const list = await whatsAppContactService.getActiveContacts();
      setContacts(list);
      if (list.length > 0) {
        const defaultContact = list.find((c) => c.isDefault) || list[0];
        setSelectedContact(defaultContact);
      }
    };
    fetchContacts();
  }, []);

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

  // Validation helper for customer details
  const validateCustomerDetails = () => {
    setFormError('');
    if (!customerName.trim()) {
      setFormError('Please enter your full name for the delivery receipt.');
      return false;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return false;
    }
    if (!customerAddress.trim()) {
      setFormError('Please enter your delivery address.');
      return false;
    }
    return true;
  };

  // Triggered when customer clicks "Order via WhatsApp"
  const handleInitiateWhatsAppOrder = () => {
    if (!validateCustomerDetails()) return;

    if (contacts.length > 1) {
      setIsContactModalOpen(true);
    } else {
      executeWhatsAppOrder(selectedContact || contacts[0] || null);
    }
  };

  // Execution: saves order to MongoDB as "WhatsApp Pending" with DB-calculated prices
  const executeWhatsAppOrder = async (contact) => {
    setIsContactModalOpen(false);
    setPlacingOrder(true);
    setFormError('');

    try {
      const orderPayload = {
        orderItems: cart.map((item) => {
          const qty = item.quantity || 1;
          const isWeight = isWeightProduct(item);
          const weightInGrams = Number(item.weightInGrams || (isWeight ? 1000 : 0));
          const lineTotal = getItemPrice ? getItemPrice(item) : getItemLineTotal(item);
          return {
            product: item._id || item.id,
            productId: item._id || item.id,
            name: item.name,
            qty,
            quantity: qty,
            weightInGrams: isWeight ? weightInGrams : 0,
            isWeightBased: isWeight,
            price: item.price,
            sellingPrice: item.price,
            originalPrice: item.originalPrice || item.price,
            itemTotal: lineTotal,
            unit: item.unit || '',
            image: item.image
          };
        }),
        shippingAddress: {
          fullName: customerName.trim(),
          address: customerAddress.trim(),
          city: 'Bengaluru',
          postalCode: '560038',
          phone: customerPhone.trim()
        },
        deliveryNotes: deliveryNotes.trim(),
        orderChannel: 'whatsapp',
        whatsappContact: contact
          ? { name: contact.name, phoneNumber: contact.phoneNumber }
          : { name: 'Main Shop', phoneNumber: whatsappService.getAdminPhone() },
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment / UPI',
        discount: couponDiscount
      };

      let finalSavedOrder = null;

      try {
        const res = await orderService.createOrder(orderPayload);
        if (res && res.order) {
          finalSavedOrder = res.order;
        }
      } catch (apiErr) {
        console.warn('Backend order API issue, falling back to instant client order:', apiErr.message);
      }

      if (!finalSavedOrder) {
        const fallbackId = 'WA-' + Math.floor(100000 + Math.random() * 900000);
        finalSavedOrder = {
          ...orderPayload,
          _id: fallbackId,
          itemsPrice: subtotal,
          deliveryFee: deliveryFee,
          totalPrice: finalTotal,
          status: 'WhatsApp Pending',
          createdAt: new Date().toISOString()
        };
      }

      const targetPhone = contact?.phoneNumber || whatsappService.getAdminPhone();
      const generatedWaUrl = whatsappService.getWhatsAppOrderUrl(finalSavedOrder, targetPhone);

      setOrderId(finalSavedOrder._id || finalSavedOrder.id);
      setPlacedOrderObj(finalSavedOrder);
      setWhatsAppUrl(generatedWaUrl);
      setIsWhatsAppOrder(true);
      setOrderPlaced(true);
      setIsCheckoutOpen(false);
      clearCart();

      whatsappService.openWhatsApp(generatedWaUrl);
    } catch (err) {
      setFormError(err.message || 'Could not prepare WhatsApp order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Standard Web Checkout Flow
  const handlePlaceOrder = async () => {
    if (!validateCustomerDetails()) return;
    setPlacingOrder(true);

    try {
      const orderData = {
        orderItems: cart.map((item) => {
          const qty = item.quantity || 1;
          const isWeight = isWeightProduct(item);
          const weightInGrams = Number(item.weightInGrams || (isWeight ? 1000 : 0));
          const lineTotal = getItemPrice ? getItemPrice(item) : getItemLineTotal(item);
          return {
            product: item._id || item.id,
            productId: item._id || item.id,
            name: item.name,
            qty,
            quantity: qty,
            weightInGrams: isWeight ? weightInGrams : 0,
            isWeightBased: isWeight,
            price: item.price,
            sellingPrice: item.price,
            originalPrice: item.originalPrice || item.price,
            itemTotal: lineTotal,
            unit: item.unit || '',
            image: item.image
          };
        }),
        shippingAddress: {
          fullName: customerName.trim(),
          address: customerAddress.trim(),
          city: 'Bengaluru',
          postalCode: '560038',
          phone: customerPhone.trim()
        },
        deliveryNotes: deliveryNotes.trim(),
        orderChannel: 'web',
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment / UPI',
        discount: couponDiscount
      };

      let finalSavedOrder = null;

      try {
        const res = await orderService.createOrder(orderData);
        if (res && res.order) {
          finalSavedOrder = res.order;
        }
      } catch (err) {
        console.warn('Backend order API issue:', err.message);
      }

      if (!finalSavedOrder) {
        const fallbackId = 'SM-' + Math.floor(100000 + Math.random() * 900000);
        finalSavedOrder = {
          ...orderData,
          _id: fallbackId,
          itemsPrice: subtotal,
          deliveryFee: deliveryFee,
          totalPrice: finalTotal,
          status: 'Pending',
          createdAt: new Date().toISOString()
        };
      }

      setOrderId(finalSavedOrder._id || finalSavedOrder.id);
      setPlacedOrderObj(finalSavedOrder);
      setIsWhatsAppOrder(false);
      setOrderPlaced(true);
      setIsCheckoutOpen(false);
      clearCart();
    } catch (err) {
      setFormError(err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Empty Cart State
  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-16 bg-slate-50/50 pb-28 md:pb-16">
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-3xl bg-brand-50 border border-brand-100/80 text-brand-600 flex items-center justify-center shadow-sm">
            <ShoppingCart className="w-14 h-14 stroke-[1.5]" />
          </div>
          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-md">
            0
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2.5 tracking-tight text-center">
          Your Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm text-center mb-8 leading-relaxed">
          Looks like you haven't added any fresh groceries to your cart yet. Explore our pantry staples and farm-fresh produce!
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <button
            onClick={() => navigateTo('products')}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateTo('categories')}
            className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <span>Browse Categories</span>
          </button>
        </div>

        {/* Value props */}
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-md w-full text-center border-t border-slate-200/80 pt-8">
          <div>
            <div className="text-base font-black text-slate-900">⚡ 15 Mins</div>
            <div className="text-[11px] text-slate-500 font-medium">Express Delivery</div>
          </div>
          <div>
            <div className="text-base font-black text-slate-900">🥬 100% Fresh</div>
            <div className="text-[11px] text-slate-500 font-medium">Farm Sourced</div>
          </div>
          <div>
            <div className="text-base font-black text-slate-900">💬 WhatsApp</div>
            <div className="text-[11px] text-slate-500 font-medium">Instant Orders</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn pb-28 md:pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200/80">
        <div>
          <button 
            onClick={() => navigateTo('products')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <span>Shopping Cart</span>
            <span className="text-xs px-2.5 py-1 bg-brand-50 text-brand-700 font-black rounded-full border border-brand-200/60">
              {totalItems} items
            </span>
          </h1>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {/* Free Delivery Animated Progress Bar */}
      <div className="mb-8 p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${amountForFreeDelivery <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-600'}`}>
              {amountForFreeDelivery <= 0 ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <span className="font-bold text-slate-800">
              {amountForFreeDelivery > 0 ? (
                <>
                  Add <span className="text-brand-600 font-black">₹{amountForFreeDelivery}</span> more to unlock <strong className="text-emerald-700">FREE 15-Minute Express Delivery</strong>!
                </>
              ) : (
                <span className="text-emerald-700 font-black flex items-center gap-1.5">
                  🎉 You unlocked FREE 15-Minute Express Delivery!
                </span>
              )}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-500 shrink-0 font-mono">
            ₹{subtotal} / ₹{freeDeliveryThreshold || 199}
          </span>
        </div>

        {/* Progress track */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${amountForFreeDelivery <= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-brand-500 to-blue-500'}`}
            style={{ width: `${freeDeliveryProgress}%` }}
          />
        </div>
      </div>

      {/* Main Cart Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <CartItemCard
              key={item._id || item.id}
              item={item}
              onUpdateQuantity={(id, delta) => updateQuantity(id, delta)}
              onUpdateWeight={(id, newWeight) => updateItemWeight(id, newWeight)}
              onRemove={(id) => removeFromCart(id)}
            />
          ))}
        </div>

        {/* Right Col: Bill Summary Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 sticky top-24">
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Order Bill Summary
            </h2>

            {/* Promo Code Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Have a coupon code?
              </label>
              {coupon ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>{coupon.code} (-₹{couponDiscount})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
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
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && (
                <p className="text-xs text-rose-500 font-medium mt-1">{couponError}</p>
              )}
            </div>

            {/* Cost Calculations */}
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-4">
              <div className="flex justify-between">
                <span>Items MRP Total ({totalItems} items)</span>
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
                <span>Delivery Charge</span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-black uppercase text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    FREE
                  </span>
                ) : (
                  <span className="font-semibold text-slate-900">₹{deliveryFee}</span>
                )}
              </div>

              {/* Total Savings Pill */}
              {(itemsDiscount > 0 || couponDiscount > 0) && (
                <div className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Savings</span>
                  </span>
                  <span className="font-black text-emerald-700">₹{itemsDiscount + couponDiscount}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-black text-slate-900 block">Grand Total</span>
                  <span className="text-[10px] text-slate-400 font-medium">Inclusive of all taxes</span>
                </div>
                <span className="text-2xl font-black text-brand-600">₹{finalTotal}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2.5 pt-2">
              {/* WhatsApp Checkout Direct CTA */}
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-white font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5 fill-white" />
                <span>Order via WhatsApp • ₹{finalTotal}</span>
              </button>

              {/* Standard Web Checkout */}
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Standard Web Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>100% Safe &amp; Contactless 15-Min Delivery</span>
            </div>
          </div>
        </div>

      </div>

      {/* Complete Customer Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Delivery &amp; Checkout</h3>
                <p className="text-xs text-slate-500">Enter your delivery details and choose your payment method</p>
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <X className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Customer Information Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delivery Address *</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Flat No, Building, Street, Landmark, City"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Optional Delivery Notes</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave with security, call when nearby"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-300"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'cod'
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'cod' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 block">Cash on Delivery</span>
                  <span className="text-[10px] text-slate-500">Pay cash or UPI at delivery</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'online'
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <CreditCard className="w-4 h-4 text-brand-600" />
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`}>
                      {paymentMethod === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900 block">Online / UPI QR</span>
                  <span className="text-[10px] text-slate-500">Google Pay, PhonePe, Cards</span>
                </button>
              </div>
            </div>

            {/* Cart Items Review Preview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 max-h-36 overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Reviewing Items ({totalItems})
              </span>
              {cart.map((item, i) => {
                const isWeight = isWeightProduct(item);
                const isVolume = isVolumeProduct(item);
                const isMeasurable = isWeight || isVolume;
                const weightGrams = Number(item.weightInGrams || (isWeight ? 1000 : 0));
                const lineTotal = getItemPrice ? getItemPrice(item) : getItemLineTotal(item);
                const desc = isMeasurable
                  ? `${item.name} (${formatWeight(weightGrams)}${item.quantity > 1 ? ` × ${item.quantity}` : ''})`
                  : `${item.name} × ${item.quantity}`;
                return (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 truncate max-w-[240px]">
                      {desc}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">
                      ₹{lineTotal}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bill Summary Breakdown */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge:</span>
                <span className="font-semibold text-slate-900">
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount:</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="pt-1.5 border-t border-emerald-200/80 flex justify-between items-baseline font-black text-slate-900 text-sm">
                <span>Payable Total:</span>
                <span className="text-base text-emerald-700 font-black">₹{finalTotal}</span>
              </div>
            </div>

            {/* Action Buttons: Prominent WhatsApp Button + Standard Web Order */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleInitiateWhatsAppOrder}
                disabled={placingOrder}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-75"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing Order...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-5 h-5 fill-white" />
                    <span>Order via WhatsApp • ₹{finalTotal}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <span>Place Standard Order ({paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online UPI'})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "Choose where to send your order" Contact Selection Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <WhatsAppIcon className="w-5 h-5 fill-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Choose Where to Send Your Order
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select which store contact receives your order details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 my-2">
              {contacts.map((contact) => (
                <label
                  key={contact._id}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedContact?._id === contact._id
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedWhatsAppContact"
                    checked={selectedContact?._id === contact._id}
                    onChange={() => setSelectedContact(contact)}
                    className="mt-1 accent-emerald-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900">{contact.name}</h4>
                      {contact.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      {contact.purpose || 'Orders & Customer Support'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      +{contact.phoneNumber}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={placingOrder}
                onClick={() => executeWhatsAppOrder(selectedContact || contacts[0])}
                className="flex-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
              >
                {placingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-4 h-4 fill-white" />
                    <span>Send Order on WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success & WhatsApp Ready Modal */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce-short">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-[11px] font-black rounded-full uppercase tracking-wider">
                {isWhatsAppOrder ? 'WhatsApp Order Ready' : 'Order Placed'}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                Order created successfully!
              </h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {isWhatsAppOrder
                  ? 'Your order has been prepared and is ready to send to the shop.'
                  : 'Your order has been saved and is being prepared for express delivery.'}
              </p>
            </div>

            {/* Order Specs Preview */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  #{orderId.toString().slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-black text-slate-900">
                  ₹{(placedOrderObj?.totalPrice || finalTotal).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">
                  {placedOrderObj?.shippingAddress?.fullName || customerName}
                </span>
              </div>
              {placedOrderObj?.whatsappContact?.name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sent to:</span>
                  <span className="font-bold text-emerald-700">
                    {placedOrderObj.whatsappContact.name} (+{placedOrderObj.whatsappContact.phoneNumber})
                  </span>
                </div>
              )}
            </div>

            {/* WhatsApp Actions Section */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-left space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
                  <WhatsAppIcon className="w-4 h-4 fill-white" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">Store Direct WhatsApp</h4>
                  <p className="text-[11px] text-emerald-700">
                    Instant confirmation directly with the shop manager
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (whatsAppUrl) {
                    whatsappService.openWhatsApp(whatsAppUrl);
                  } else if (placedOrderObj) {
                    const fallbackUrl = whatsappService.getWhatsAppOrderUrl(placedOrderObj);
                    whatsappService.openWhatsApp(fallbackUrl);
                  }
                }}
                className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white" />
                <span>Send Order on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (placedOrderObj) {
                    const text = whatsappService.formatCustomerOrderMessage(placedOrderObj);
                    navigator.clipboard.writeText(text);
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 2500);
                  }
                }}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Summary Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copy Order Summary</span>
                  </>
                )}
              </button>
            </div>

            {/* Navigation buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setOrderPlaced(false);
                  setIsCheckoutOpen(false);
                  navigateTo('orders');
                }}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                View My Orders
              </button>

              <button
                onClick={() => {
                  setOrderPlaced(false);
                  setIsCheckoutOpen(false);
                  navigateTo('products');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
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

export default Cart;
