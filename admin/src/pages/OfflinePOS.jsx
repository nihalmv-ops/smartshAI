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
  Scale,
  X
} from 'lucide-react';
import { posService } from '../services/posService';
import { categoryService, defaultCategories } from '../services/categoryService';
import { AdminHeader } from '../components/layout/AdminHeader';
import { useAdminAuth } from '../context/AdminAuthContext';

// Unit normalization and detection helpers
export const normalizeUnit = (unit) => {
  if (!unit) return 'piece';
  const u = unit.toString().trim().toLowerCase();
  if (['kg', 'kilogram', 'kilograms'].includes(u)) return 'kg';
  if (['gram', 'grams', 'g', 'gm'].includes(u)) return 'gram';
  if (['litre', 'liter', 'litres', 'liters', 'l'].includes(u)) return 'litre';
  if (['piece', 'pieces', 'pc', 'pcs'].includes(u)) return 'piece';
  if (['pack', 'packs', 'packet', 'packets'].includes(u)) return 'pack';
  if (['box', 'boxes'].includes(u)) return 'box';
  return u;
};

export const isWeightedUnit = (unit) => {
  const norm = normalizeUnit(unit);
  return ['kg', 'gram', 'litre'].includes(norm);
};

export const getUnitRateLabel = (unit) => {
  const norm = normalizeUnit(unit);
  switch (norm) {
    case 'kg':
      return 'kg';
    case 'gram':
      return 'g';
    case 'litre':
      return 'litre';
    case 'piece':
      return 'piece';
    case 'pack':
      return 'pack';
    case 'box':
      return 'box';
    default:
      return unit || 'piece';
  }
};

/**
 * Supermarket weight/quantity parser:
 * Handles:
 * - Direct numbers: "1.5" -> 1.5, "0.5" -> 0.5
 * - Explicit unit strings: "1.5kg" -> 1.5
 * - Supermarket gram conversion: "500g", "250g", "750g", "1000g" -> if product unit is kg, converts to 0.5, 0.25, 0.75, 1.0!
 */
export const parseWeightOrQty = (inputVal, productUnit) => {
  if (typeof inputVal === 'number') {
    return isNaN(inputVal) || inputVal <= 0 ? null : Math.round(inputVal * 1000) / 1000;
  }
  if (!inputVal || typeof inputVal !== 'string') return null;

  const raw = inputVal.trim().toLowerCase();
  if (!raw) return null;

  const normUnit = normalizeUnit(productUnit);

  // Check if string ends with 'g' or 'gm' (e.g. "500g", "250 gm", "500 grams")
  const gramMatch = raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm|gram|grams)$/);
  if (gramMatch) {
    const valInGrams = parseFloat(gramMatch[1]);
    if (isNaN(valInGrams) || valInGrams <= 0) return null;
    // If product is priced per kg, 500g is 0.5 kg
    if (normUnit === 'kg') {
      return Math.round((valInGrams / 1000) * 1000) / 1000;
    }
    return Math.round(valInGrams * 1000) / 1000;
  }

  // Check if string ends with 'kg' (e.g. "1.5kg", "0.5 kg")
  const kgMatch = raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*kg$/);
  if (kgMatch) {
    const valInKg = parseFloat(kgMatch[1]);
    if (isNaN(valInKg) || valInKg <= 0) return null;
    return Math.round(valInKg * 1000) / 1000;
  }

  // Pure numeric or numeric prefix
  const numMatch = raw.match(/^([0-9]+(?:\.[0-9]+)?)/);
  if (!numMatch) return null;

  const val = parseFloat(numMatch[1]);
  if (isNaN(val) || val <= 0) return null;

  return Math.round(val * 1000) / 1000;
};

// Fast inline editable table row for POS cart with Weight & Custom Price support
const PosCartItemRow = ({
  item,
  itemIndex,
  canEditPrice,
  onUpdateQty,
  onUpdatePrice,
  onRemove,
  onPriceCommittedFocusSearch,
  onNavigateItem,
  registerRowRef,
  itemFocusTrigger,
  showToast
}) => {
  const normUnit = normalizeUnit(item.unit);
  const isWeight = isWeightedUnit(item.unit);
  const unitLabel = getUnitRateLabel(item.unit);

  const orig = item.originalPrice !== undefined ? item.originalPrice : (item.price || 0);
  const currentBill = item.billPrice !== undefined ? item.billPrice : (item.price || 0);
  const currentQty = Number(item.qty !== undefined ? item.qty : 1);
  const itemTotal = Math.round(currentBill * currentQty * 100) / 100;
  const isOverridden = item.isPriceOverridden || Math.abs(currentBill - orig) > 0.001;

  // Local inputs for rapid and responsive typing
  const [localWeight, setLocalWeight] = useState(currentQty.toString());
  const [localPrice, setLocalPrice] = useState(currentBill.toString());
  const weightInputRef = useRef(null);

  // Expose focus handler to parent for arrow key navigation
  useEffect(() => {
    if (registerRowRef) {
      registerRowRef(item._id, {
        focusInput: () => {
          if (weightInputRef.current) {
            weightInputRef.current.focus();
            weightInputRef.current.select();
          }
        }
      });
    }
    return () => {
      if (registerRowRef) registerRowRef(item._id, null);
    };
  }, [item._id, registerRowRef]);

  // Sync state with cart changes
  useEffect(() => {
    setLocalWeight(currentQty.toString());
  }, [currentQty]);

  useEffect(() => {
    setLocalPrice(currentBill.toString());
  }, [currentBill]);

  // Auto-focus weight field when item is added/scanned
  useEffect(() => {
    if (itemFocusTrigger && itemFocusTrigger.id === item._id) {
      if (weightInputRef.current) {
        weightInputRef.current.focus();
        weightInputRef.current.select();
      }
    }
  }, [itemFocusTrigger, item._id]);

  // Commit weight / quantity change
  const commitWeightChange = () => {
    const trimmed = localWeight.toString().trim();
    if (trimmed === '') {
      setLocalWeight(currentQty.toString());
      return;
    }
    const parsed = parseWeightOrQty(trimmed, item.unit);
    if (!parsed || parsed <= 0) {
      if (showToast) showToast('Please enter a valid positive weight/quantity', 'error');
      setLocalWeight(currentQty.toString());
      return;
    }
    if (Math.abs(parsed - currentQty) > 0.0001) {
      onUpdateQty(item._id, parsed);
    }
    setLocalWeight(parsed.toString());
  };

  const handleWeightKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitWeightChange();
      e.target.blur();
      if (onPriceCommittedFocusSearch) {
        onPriceCommittedFocusSearch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalWeight(currentQty.toString());
      e.target.blur();
      if (onPriceCommittedFocusSearch) {
        onPriceCommittedFocusSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitWeightChange();
      if (onNavigateItem) {
        onNavigateItem(itemIndex + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitWeightChange();
      if (itemIndex === 0 && onPriceCommittedFocusSearch) {
        onPriceCommittedFocusSearch();
      } else if (onNavigateItem) {
        onNavigateItem(itemIndex - 1);
      }
    } else if (e.key === 'Delete' && (e.ctrlKey || e.altKey || localWeight.trim() === '')) {
      e.preventDefault();
      onRemove(item._id);
      if (onPriceCommittedFocusSearch) {
        onPriceCommittedFocusSearch();
      }
    }
  };

  // Commit price change
  const commitPriceChange = () => {
    const trimmed = localPrice.trim();
    if (trimmed === '') {
      setLocalPrice(currentBill.toString());
      return;
    }
    const parsed = Number(trimmed);
    if (isNaN(parsed) || parsed <= 0) {
      if (showToast) showToast('Price must be a valid positive number', 'error');
      setLocalPrice(currentBill.toString());
      return;
    }
    const safePrice = Math.round(parsed * 100) / 100;
    if (Math.abs(safePrice - currentBill) > 0.001) {
      onUpdatePrice(item._id, safePrice);
    }
    setLocalPrice(safePrice.toString());
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitPriceChange();
      e.target.blur();
      if (onPriceCommittedFocusSearch) {
        onPriceCommittedFocusSearch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setLocalPrice(currentBill.toString());
      e.target.blur();
      if (onPriceCommittedFocusSearch) {
        onPriceCommittedFocusSearch();
      }
    }
  };

  // Quick weight presets for fast single-click weights
  const presetWeights = isWeight
    ? normUnit === 'litre'
      ? [
          { label: '0.5L', val: 0.5 },
          { label: '1L', val: 1 },
          { label: '2L', val: 2 }
        ]
      : [
          { label: '0.25', val: 0.25, title: '250g / 0.25kg' },
          { label: '0.5', val: 0.5, title: '500g / 0.5kg' },
          { label: '1.0', val: 1, title: '1kg' },
          { label: '1.5', val: 1.5, title: '1.5kg' },
          { label: '2.0', val: 2, title: '2kg' }
        ]
    : null;

  const handlePillSelect = (val) => {
    onUpdateQty(item._id, val);
    setLocalWeight(val.toString());
    if (onPriceCommittedFocusSearch) {
      onPriceCommittedFocusSearch();
    }
  };

  return (
    <tr
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Delete') {
          e.preventDefault();
          onRemove(item._id);
          if (onPriceCommittedFocusSearch) {
            onPriceCommittedFocusSearch();
          }
        }
      }}
      className="hover:bg-slate-50/80 transition-colors focus:outline-none focus:bg-emerald-50/40"
    >
      {/* Product Column */}
      <td className="py-2.5 px-2.5 max-w-[120px]">
        <p className="font-bold text-slate-900 truncate leading-tight text-xs" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-500 font-semibold uppercase bg-slate-100 px-1 py-0.2 rounded">
            {unitLabel}
          </span>
          {isOverridden && (
            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
              Custom
            </span>
          )}
        </div>
      </td>

      {/* Qty / Weight Column: Direct Editable Field with Presets */}
      <td className="py-2 px-1 text-center whitespace-nowrap">
        {isWeight ? (
          <div className="flex flex-col items-center gap-1">
            <div className="relative inline-flex items-center rounded-lg border border-slate-300 bg-white hover:border-slate-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-2xs">
              <input
                ref={weightInputRef}
                type="text"
                inputMode="decimal"
                value={localWeight}
                onChange={(e) => setLocalWeight(e.target.value)}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
                onKeyDown={handleWeightKeyDown}
                onBlur={commitWeightChange}
                className="w-12 sm:w-14 py-1 pl-1.5 pr-0.5 text-right font-mono font-bold text-xs text-slate-900 bg-transparent focus:outline-none"
                placeholder="1.0"
                title="Enter weight (e.g. 1.5, 0.5, 500g, 250g) and press Enter"
                aria-label={`Weight for ${item.name}`}
              />
              <span className="pr-1.5 pl-0.5 text-[10px] font-bold text-slate-500 select-none">
                {unitLabel}
              </span>
            </div>

            {/* Quick Weight Presets Pills */}
            {presetWeights && (
              <div className="flex items-center gap-0.5">
                {presetWeights.map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handlePillSelect(p.val)}
                    title={p.title || `Set to ${p.label} ${unitLabel}`}
                    className={`px-1 py-0.2 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                      Math.abs(currentQty - p.val) < 0.001
                        ? 'bg-emerald-600 text-white font-black shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50 shadow-2xs">
            <button
              type="button"
              onClick={() => onUpdateQty(item._id, Math.max(1, currentQty - 1))}
              className="w-5 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-l cursor-pointer text-xs font-bold"
              title="Decrease quantity"
            >
              -
            </button>
            <input
              ref={weightInputRef}
              type="text"
              inputMode="numeric"
              value={localWeight}
              onChange={(e) => setLocalWeight(e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              onKeyDown={handleWeightKeyDown}
              onBlur={commitWeightChange}
              className="w-7 py-0.5 text-center font-bold font-mono text-slate-900 text-xs bg-transparent focus:outline-none"
              title="Enter quantity and press Enter"
              aria-label={`Quantity for ${item.name}`}
            />
            <button
              type="button"
              onClick={() => onUpdateQty(item._id, currentQty + 1)}
              className="w-5 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-r cursor-pointer text-xs font-bold"
              title="Increase quantity"
            >
              +
            </button>
          </div>
        )}
      </td>

      {/* Price Column: Fast Editable Inline Input with /unit display */}
      <td className="py-2.5 px-1 text-right whitespace-nowrap">
        <div className="flex flex-col items-end">
          <div
            className={`relative inline-flex items-center rounded-lg border transition-all ${
              isOverridden
                ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-300/60'
                : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
            }`}
          >
            <span className="pl-1.5 text-[11px] font-bold text-slate-400 select-none">₹</span>
            <input
              type="number"
              step="0.5"
              min="0.01"
              disabled={!canEditPrice}
              readOnly={!canEditPrice}
              value={localPrice}
              onChange={(e) => setLocalPrice(e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              onKeyDown={handlePriceKeyDown}
              onBlur={commitPriceChange}
              className="w-12 sm:w-14 py-1 pl-0.5 pr-0.5 text-right font-mono font-bold text-xs text-slate-900 bg-transparent focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
              title={
                canEditPrice
                  ? 'Click to change price (Press Enter to apply & resume scanning)'
                  : 'Requires admin or staff permission to edit price'
              }
              aria-label={`Price for ${item.name}`}
            />
            <span className="pr-1 text-[9px] font-bold text-slate-400 select-none">
              /{unitLabel}
            </span>
          </div>

          {/* Quick reset to regular catalog price if overridden */}
          {isOverridden && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] text-slate-400 line-through font-mono">
                ₹{orig}/{unitLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  onUpdatePrice(item._id, orig);
                  setLocalPrice(orig.toString());
                }}
                title={`Reset to catalog price ₹${orig}`}
                className="text-[9px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </td>

      {/* Total Column */}
      <td className="py-2.5 px-1.5 text-right font-mono font-black text-slate-900 whitespace-nowrap text-xs">
        ₹{itemTotal}
      </td>

      {/* Action Column: Delete */}
      <td className="py-2.5 px-1 text-center whitespace-nowrap">
        <button
          type="button"
          onClick={() => onRemove(item._id)}
          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
          title="Remove item"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
};

export const OfflinePOS = () => {
  const { user } = useAdminAuth();
  const canEditPrice = user?.role === 'admin' || user?.role === 'staff';

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
  const [itemFocusTrigger, setItemFocusTrigger] = useState(null);

  // Shift & Status
  const [shiftSummary, setShiftSummary] = useState({ totalShiftSales: 0, totalTransactions: 0, paymentTotals: {} });
  const [submittingSale, setSubmittingSale] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [toast, setToast] = useState(null);

  const searchInputRef = useRef(null);
  const cartRowRefs = useRef({});

  const registerRowRef = (id, ref) => {
    if (!ref) {
      delete cartRowRefs.current[id];
    } else {
      cartRowRefs.current[id] = ref;
    }
  };

  const handleNavigateCartItem = (targetIndex) => {
    if (targetIndex < 0) {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select?.();
      }
      return;
    }
    if (targetIndex >= cart.length) return;
    const targetItem = cart[targetIndex];
    if (targetItem && cartRowRefs.current[targetItem._id]) {
      cartRowRefs.current[targetItem._id].focusInput();
    }
  };

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

  // Cart operations with Weight & Qty support
  const addToCart = (product) => {
    const existing = cart.find((item) => item._id === product._id);
    const isWeight = isWeightedUnit(product.unit);

    if (existing) {
      const currentQty = Number(existing.qty || 1);
      const stock = product.stockCount !== undefined ? product.stockCount : 50;
      if (!isWeight && currentQty >= stock) {
        showToast(`Cannot add more. Only ${stock} ${product.unit || 'units'} available in stock.`, 'error');
        return;
      }
      // For piece items, add 1. For weight items, retain current qty and focus weight field so cashier enters weight
      const newQty = isWeight ? currentQty : currentQty + 1;
      setCart(cart.map((item) => (item._id === product._id ? { ...item, qty: newQty } : item)));
    } else {
      const catalogPrice = Number(product.price || 0);
      setCart([
        ...cart,
        {
          ...product,
          originalPrice: catalogPrice,
          billPrice: catalogPrice,
          price: catalogPrice,
          isPriceOverridden: false,
          qty: 1,
          unit: product.unit || 'piece'
        }
      ]);
    }

    // Auto-focus weight field for rapid cashier entry
    setItemFocusTrigger({ id: product._id, time: Date.now() });
    showToast(`Added "${product.name}" (${getUnitRateLabel(product.unit)}) to bill`);
  };

  const updateCartQty = (productId, newQtyRaw) => {
    const parsed = Number(newQtyRaw);
    if (isNaN(parsed) || parsed <= 0) {
      removeFromCart(productId);
      return;
    }
    const cleanQty = Math.round(parsed * 1000) / 1000;
    const prod = products.find((p) => p._id === productId);
    if (prod && cleanQty > (prod.stockCount || 50)) {
      showToast(`Only ${prod.stockCount} ${prod.unit || 'units'} in stock`, 'error');
      return;
    }
    setCart(cart.map((item) => (item._id === productId ? { ...item, qty: cleanQty } : item)));
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

  // Fast inline price update for current bill only
  const updateItemPrice = (productId, newPriceRaw) => {
    if (!canEditPrice) {
      showToast('Permission denied: Only admin and staff can change billing price', 'error');
      return;
    }

    const parsed = Number(newPriceRaw);
    if (newPriceRaw === '' || isNaN(parsed) || parsed <= 0) {
      showToast('Please enter a valid positive billing price', 'error');
      return;
    }

    const roundedPrice = Math.round(parsed * 100) / 100;

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item._id === productId) {
          const orig = item.originalPrice !== undefined ? item.originalPrice : (item.price || 0);
          const isOverridden = Math.abs(roundedPrice - orig) > 0.001;
          return {
            ...item,
            billPrice: roundedPrice,
            price: roundedPrice,
            sellingPrice: roundedPrice,
            isPriceOverridden: isOverridden
          };
        }
        return item;
      })
    );

    showToast(`Price set to ₹${roundedPrice} for current bill`);
  };

  // Re-focus search/barcode scanner after pressing Enter on price or weight
  const handlePriceCommittedFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select?.();
    }
  };

  // Precise calculations using per-item billing price and decimal weight/qty
  const subtotal = Math.round(
    cart.reduce(
      (acc, item) =>
        acc +
        (Number(item.billPrice !== undefined ? item.billPrice : item.price) || 0) *
          (Number(item.qty !== undefined ? item.qty : 1) || 0),
      0
    ) * 100
  ) / 100;

  const safeDiscount = Math.min(Number(discountAmount) || 0, subtotal);
  const finalTotal = Math.max(0, Math.round((subtotal - safeDiscount) * 100) / 100);
  const tenderedNum = Number(amountTendered) || 0;
  const changeDue = Math.max(0, Math.round((tenderedNum - finalTotal) * 100) / 100);

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
        items: cart.map((item) => {
          const currentBillPrice = item.billPrice !== undefined ? item.billPrice : item.price;
          const cleanQty = Math.round(Number(item.qty !== undefined ? item.qty : 1) * 1000) / 1000;
          return {
            product: item._id,
            name: item.name,
            qty: cleanQty,
            quantity: cleanQty,
            originalPrice: item.originalPrice !== undefined ? item.originalPrice : item.price,
            billingPrice: currentBillPrice,
            billPrice: currentBillPrice,
            price: currentBillPrice,
            category: item.category,
            unit: item.unit || 'piece'
          };
        }),
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
                placeholder="Scan barcode, or search product name / SKU... (Press ↓ for bill items)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' && cart.length > 0) {
                    e.preventDefault();
                    handleNavigateCartItem(0);
                  }
                }}
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
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-slate-500 capitalize">{p.unit || 'piece'}</span>
                        {isWeightedUnit(p.unit) && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                            <Scale className="w-2.5 h-2.5" /> Weight
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100">
                        <span className="text-xs sm:text-sm font-black text-slate-900">
                          ₹{p.price} <span className="text-[10px] font-normal text-slate-500">/ {getUnitRateLabel(p.unit)}</span>
                        </span>
                        <button
                          type="button"
                          className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:bg-emerald-700 active:scale-90 transition-transform cursor-pointer"
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

          {/* Cart Items Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto max-h-64 border border-slate-200/80 rounded-xl bg-slate-50/50">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Cart is empty. Tap items or scan barcodes to add.
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[320px]">
                <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Product</th>
                    <th className="py-2 px-1 text-center">Qty / Weight</th>
                    <th className="py-2 px-1 text-right">Price</th>
                    <th className="py-2 px-1.5 text-right">Total</th>
                    <th className="py-2 px-1 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 bg-white">
                  {cart.map((item, idx) => (
                    <PosCartItemRow
                      key={item._id}
                      item={item}
                      itemIndex={idx}
                      canEditPrice={canEditPrice}
                      onUpdateQty={updateCartQty}
                      onUpdatePrice={updateItemPrice}
                      onRemove={removeFromCart}
                      onPriceCommittedFocusSearch={handlePriceCommittedFocusSearch}
                      onNavigateItem={handleNavigateCartItem}
                      registerRowRef={registerRowRef}
                      itemFocusTrigger={itemFocusTrigger}
                      showToast={showToast}
                    />
                  ))}
                </tbody>
              </table>
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
                <span>Subtotal ({cart.length} item{cart.length === 1 ? '' : 's'})</span>
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
              {completedReceipt.items.map((it, idx) => {
                const isOverridden =
                  it.isPriceOverridden ||
                  (it.originalPrice && Math.abs(it.price - it.originalPrice) > 0.001);
                const uLabel = getUnitRateLabel(it.unit);
                return (
                  <div key={idx} className="pt-1 flex justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{it.name}</p>
                      <span className="text-[10px] text-slate-500">
                        {it.qty} {uLabel} × ₹{it.price} / {uLabel}
                        {isOverridden && (
                          <span className="text-amber-800 font-semibold ml-1">
                            (Reg. ₹{it.originalPrice} / {uLabel})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">
                      ₹{it.itemTotal !== undefined ? it.itemTotal : Math.round(it.price * it.qty * 100) / 100}
                    </span>
                  </div>
                );
              })}
            </div>

            {completedReceipt.priceOverrides && completedReceipt.priceOverrides.length > 0 && (
              <div className="text-center py-1 px-2 bg-amber-50 rounded-lg text-[10px] text-amber-800 border border-amber-200 font-medium">
                Includes authorized custom billing price adjustments
              </div>
            )}

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

