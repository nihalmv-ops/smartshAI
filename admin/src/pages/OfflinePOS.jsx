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

  // Check if string ends with 'g' or 'gm' (e.g. "500g", "250 gm", "500 grams", "3073g", "127g")
  const gramMatch = raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:g|gm|gms|gram|grams)$/);
  if (gramMatch) {
    const valInGrams = parseFloat(gramMatch[1]);
    if (isNaN(valInGrams) || valInGrams <= 0) return null;
    // If product is priced per kg, 500g is 0.5 kg, 3073g is 3.073 kg
    if (normUnit === 'kg') {
      return Math.round((valInGrams / 1000) * 1000) / 1000;
    }
    return Math.round(valInGrams * 1000) / 1000;
  }

  // Check if string ends with 'kg' (e.g. "1.5kg", "0.5 kg", "3.073kg")
  const kgMatch = raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:kg|kgs|kilo|kilos)$/);
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

// Fast inline editable table row for POS cart with Custom Unit, Exact Weight & Live Price support
const PosCartItemRow = ({
  item,
  itemIndex,
  canEditPrice,
  onUpdateQty,
  onUpdatePrice,
  onUpdateUnit,
  onRemove,
  onPriceCommittedFocusSearch,
  onNavigateItem,
  registerRowRef,
  itemFocusTrigger,
  showToast
}) => {
  const normUnit = normalizeUnit(item.unit);
  const isWeight = isWeightedUnit(item.unit) || item.displayUnit === 'g' || item.displayUnit === 'kg';
  const activeDisplayUnit = item.displayUnit || (normUnit === 'gram' ? 'g' : normUnit);
  const unitLabel = getUnitRateLabel(item.unit);

  const orig = item.originalPrice !== undefined ? item.originalPrice : (item.price || 0);
  const currentBill = item.billPrice !== undefined ? item.billPrice : (item.price || 0);
  const currentQty = Number(item.qty !== undefined ? item.qty : 1);

  // Local inputs for rapid and responsive typing with live price calculation
  const formatQtyForDisplayUnit = (qtyVal, dispUnit, baseNormUnit) => {
    if (dispUnit === 'g' && baseNormUnit === 'kg') {
      return Math.round(qtyVal * 1000).toString();
    }
    return qtyVal.toString();
  };

  const [localWeight, setLocalWeight] = useState(() =>
    formatQtyForDisplayUnit(currentQty, activeDisplayUnit, normUnit)
  );
  const [localPrice, setLocalPrice] = useState(currentBill.toString());
  const weightInputRef = useRef(null);

  // Calculate live preview qty and total on every keystroke
  const liveParsedQty = (() => {
    const raw = localWeight.toString().trim();
    if (!raw) return currentQty;
    if (activeDisplayUnit === 'g' && normUnit === 'kg') {
      const gNum = parseFloat(raw);
      if (!isNaN(gNum) && gNum > 0) return Math.round((gNum / 1000) * 1000) / 1000;
    }
    const p = parseWeightOrQty(raw, item.unit);
    return p && p > 0 ? p : currentQty;
  })();

  const liveParsedPrice = (() => {
    const p = parseFloat(localPrice);
    return !isNaN(p) && p > 0 ? Math.round(p * 100) / 100 : currentBill;
  })();

  const itemTotal = Math.round(liveParsedPrice * liveParsedQty * 100) / 100;
  const isOverridden = item.isPriceOverridden || Math.abs(liveParsedPrice - orig) > 0.001;

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
    setLocalWeight(formatQtyForDisplayUnit(currentQty, activeDisplayUnit, normUnit));
  }, [currentQty, activeDisplayUnit, normUnit]);

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

  // Live change handler for weight/quantity so price updates simultaneously as user types
  const handleWeightInputChange = (val) => {
    setLocalWeight(val);
    const trimmed = val.trim();
    if (!trimmed) return;
    let computedQty = null;
    if (activeDisplayUnit === 'g' && normUnit === 'kg') {
      const gVal = parseFloat(trimmed);
      if (!isNaN(gVal) && gVal > 0) {
        computedQty = Math.round((gVal / 1000) * 1000) / 1000;
      }
    } else {
      computedQty = parseWeightOrQty(trimmed, item.unit);
    }
    if (computedQty && computedQty > 0 && Math.abs(computedQty - currentQty) > 0.0001) {
      onUpdateQty(item._id, computedQty, true);
    }
  };

  // Commit weight / quantity change on blur or Enter
  const commitWeightChange = () => {
    const trimmed = localWeight.toString().trim();
    if (trimmed === '') {
      setLocalWeight(formatQtyForDisplayUnit(currentQty, activeDisplayUnit, normUnit));
      return;
    }
    let parsed = null;
    if (activeDisplayUnit === 'g' && normUnit === 'kg') {
      const gVal = parseFloat(trimmed);
      if (!isNaN(gVal) && gVal > 0) {
        parsed = Math.round((gVal / 1000) * 1000) / 1000;
      }
    } else {
      parsed = parseWeightOrQty(trimmed, item.unit);
    }
    if (!parsed || parsed <= 0) {
      if (showToast) showToast('Please enter a valid positive weight/quantity', 'error');
      setLocalWeight(formatQtyForDisplayUnit(currentQty, activeDisplayUnit, normUnit));
      return;
    }
    if (Math.abs(parsed - currentQty) > 0.0001) {
      onUpdateQty(item._id, parsed);
    }
    setLocalWeight(formatQtyForDisplayUnit(parsed, activeDisplayUnit, normUnit));
  };

  // Switch unit (g <-> kg <-> piece <-> pack <-> box <-> litre) and update price/weight simultaneously
  const handleUnitSelectChange = (newSelectedUnit) => {
    if (!onUpdateUnit) return;
    onUpdateUnit(item._id, newSelectedUnit);
    if (newSelectedUnit === 'g' && normUnit === 'kg') {
      setLocalWeight(Math.round(currentQty * 1000).toString());
    } else if (newSelectedUnit === 'kg' && normUnit === 'kg') {
      setLocalWeight(currentQty.toString());
    }
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
      setLocalWeight(formatQtyForDisplayUnit(currentQty, activeDisplayUnit, normUnit));
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

  // Live price input change so line total & bill total update immediately
  const handlePriceInputChange = (val) => {
    setLocalPrice(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      const safePrice = Math.round(parsed * 100) / 100;
      if (Math.abs(safePrice - currentBill) > 0.001) {
        onUpdatePrice(item._id, safePrice, true);
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
          { label: '0.5L', val: 0.5, dispUnit: 'litre' },
          { label: '1L', val: 1, dispUnit: 'litre' },
          { label: '2L', val: 2, dispUnit: 'litre' }
        ]
      : [
          { label: '100g', val: 0.1, dispUnit: 'g', title: '100g (0.1kg)' },
          { label: '250g', val: 0.25, dispUnit: 'g', title: '250g (0.25kg)' },
          { label: '500g', val: 0.5, dispUnit: 'g', title: '500g (0.5kg)' },
          { label: '1kg', val: 1, dispUnit: 'kg', title: '1kg' },
          { label: '2kg', val: 2, dispUnit: 'kg', title: '2kg' }
        ]
    : null;

  const handlePillSelect = (preset) => {
    if (onUpdateUnit && preset.dispUnit) {
      onUpdateUnit(item._id, preset.dispUnit);
    }
    onUpdateQty(item._id, preset.val);
    if (preset.dispUnit === 'g' && normUnit === 'kg') {
      setLocalWeight(Math.round(preset.val * 1000).toString());
    } else {
      setLocalWeight(preset.val.toString());
    }
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
      <td className="py-2.5 px-2.5 max-w-[125px]">
        <p className="font-bold text-slate-900 truncate leading-tight text-xs" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
            {activeDisplayUnit === 'g' && normUnit === 'kg'
              ? `${Math.round(liveParsedQty * 1000)} g`
              : `${liveParsedQty} ${unitLabel}`}
          </span>
          {isOverridden && (
            <span className="inline-block px-1 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
              Custom ₹
            </span>
          )}
        </div>
      </td>

      {/* Qty / Weight + Custom Unit Selector Column */}
      <td className="py-2 px-1 text-center whitespace-nowrap">
        <div className="flex flex-col items-center gap-1">
          <div className="relative inline-flex items-center rounded-lg border border-slate-300 bg-white hover:border-slate-400 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-2xs">
            {!isWeight && (
              <button
                type="button"
                onClick={() => onUpdateQty(item._id, Math.max(1, currentQty - 1))}
                className="w-5 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-l cursor-pointer text-xs font-bold"
                title="Decrease quantity"
              >
                -
              </button>
            )}
            <input
              ref={weightInputRef}
              type="text"
              inputMode="decimal"
              value={localWeight}
              onChange={(e) => handleWeightInputChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              onKeyDown={handleWeightKeyDown}
              onBlur={commitWeightChange}
              className="w-12 sm:w-14 py-1 pl-1.5 pr-0.5 text-right font-mono font-bold text-xs text-slate-900 bg-transparent focus:outline-none"
              placeholder={activeDisplayUnit === 'g' ? '250' : '1.0'}
              title="Enter exact weight or quantity (e.g. 3.073, 250g, 127g) — price updates live!"
              aria-label={`Weight or quantity for ${item.name}`}
            />
            {!isWeight && (
              <button
                type="button"
                onClick={() => onUpdateQty(item._id, currentQty + 1)}
                className="w-5 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold"
                title="Increase quantity"
              >
                +
              </button>
            )}
            {/* Custom Unit Selector Dropdown */}
            <select
              value={activeDisplayUnit}
              onChange={(e) => handleUnitSelectChange(e.target.value)}
              aria-label={`Unit for ${item.name}`}
              title="Change product unit (kg, g, piece, pack, box, litre)"
              className="py-1 pl-1 pr-1.5 text-[10px] font-black text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border-l border-slate-200 rounded-r-lg focus:outline-none cursor-pointer uppercase"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="piece">pc</option>
              <option value="pack">pack</option>
              <option value="box">box</option>
              <option value="litre">L</option>
            </select>
          </div>

          {/* Quick Weight Presets Pills */}
          {presetWeights && (
            <div className="flex items-center gap-0.5 flex-wrap justify-center">
              {presetWeights.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePillSelect(p)}
                  title={p.title || `Set to ${p.label}`}
                  className={`px-1 py-0.2 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                    Math.abs(liveParsedQty - p.val) < 0.001
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
      </td>

      {/* Price Column: Fast Editable Inline Input with simultaneous live total update */}
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
              step="any"
              min="0.01"
              disabled={!canEditPrice}
              readOnly={!canEditPrice}
              value={localPrice}
              onChange={(e) => handlePriceInputChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              onKeyDown={handlePriceKeyDown}
              onBlur={commitPriceChange}
              className="w-12 sm:w-14 py-1 pl-0.5 pr-0.5 text-right font-mono font-bold text-xs text-slate-900 bg-transparent focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
              title={
                canEditPrice
                  ? 'Change product price live (Press Enter to apply & resume scanning)'
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
      <td className="py-2.5 px-1.5 text-right font-mono font-black text-emerald-800 whitespace-nowrap text-xs">
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
  const [allCatalogProducts, setAllCatalogProducts] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedSuggestionIdx, setHighlightedSuggestionIdx] = useState(0);

  // Per-card quick custom unit/weight selection on POS catalog cards
  const [cardUnitSelections, setCardUnitSelections] = useState({});

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
  const searchContainerRef = useRef(null);
  const cartRowRefs = useRef({});

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      const [prodData, allProdData, catData, shiftData] = await Promise.allSettled([
        posService.getProducts(searchQuery, selectedCategory),
        posService.getProducts('', 'all'),
        categoryService.getAllCategories(),
        posService.getShiftSummary()
      ]);

      if (prodData.status === 'fulfilled' && prodData.value?.products) {
        setProducts(prodData.value.products);
      }
      if (allProdData.status === 'fulfilled' && allProdData.value?.products) {
        setAllCatalogProducts(allProdData.value.products);
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

  // Live product suggestions matching searchQuery
  const searchSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const sourceList = allCatalogProducts.length > 0 ? allCatalogProducts : products;
    return sourceList
      .filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toString().toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery, allCatalogProducts, products]);

  // Live filtered products for grid
  const displayedProducts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    const sourceList = allCatalogProducts.length > 0 ? allCatalogProducts : products;
    return sourceList.filter((p) => {
      const matchesCat =
        selectedCategory === 'all' ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      const matchesQuery =
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toString().toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [searchQuery, selectedCategory, products, allCatalogProducts]);

  // Search debounce or enter trigger
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (showSuggestions && searchSuggestions.length > 0) {
      const chosen = searchSuggestions[highlightedSuggestionIdx] || searchSuggestions[0];
      if (chosen) {
        addToCart(chosen);
        setSearchQuery('');
        setShowSuggestions(false);
        return;
      }
    }
    try {
      const res = await posService.getProducts(searchQuery, selectedCategory);
      if (res && res.products) {
        setProducts(res.products);
        if (res.products.length === 1 && searchQuery.trim().length > 2) {
          addToCart(res.products[0]);
          setSearchQuery('');
          setShowSuggestions(false);
        }
      }
    } catch (err) {
      console.warn('Search query error:', err);
    }
  };

  // Cart operations with Custom Unit, Exact Weight & Dynamic Price support
  const addToCart = (product, customOption = null) => {
    const existing = cart.find((item) => item._id === product._id);
    const isWeight = isWeightedUnit(product.unit);
    const customQty = customOption?.qty !== undefined ? Number(customOption.qty) : 1;
    const customDispUnit = customOption?.displayUnit || (isWeight ? 'kg' : normalizeUnit(product.unit));
    const customBillPrice =
      customOption?.billPrice !== undefined ? Number(customOption.billPrice) : Number(product.price || 0);

    if (existing) {
      const currentQty = Number(existing.qty || 1);
      const stock = product.stockCount !== undefined ? product.stockCount : 50;
      if (!isWeight && currentQty >= stock) {
        showToast(`Cannot add more. Only ${stock} ${product.unit || 'units'} available in stock.`, 'error');
        return;
      }
      const newQty = customOption?.qty !== undefined ? customQty : isWeight ? currentQty : currentQty + 1;
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                qty: newQty,
                displayUnit: customOption?.displayUnit || item.displayUnit,
                billPrice: customOption?.billPrice !== undefined ? customBillPrice : item.billPrice,
                price: customOption?.billPrice !== undefined ? customBillPrice : item.price,
                isPriceOverridden:
                  customOption?.billPrice !== undefined
                    ? Math.abs(customBillPrice - item.originalPrice) > 0.001
                    : item.isPriceOverridden
              }
            : item
        )
      );
    } else {
      const catalogPrice = Number(product.price || 0);
      setCart([
        ...cart,
        {
          ...product,
          originalPrice: catalogPrice,
          billPrice: customBillPrice,
          price: customBillPrice,
          isPriceOverridden: Math.abs(customBillPrice - catalogPrice) > 0.001,
          qty: customQty,
          unit: product.unit || 'piece',
          displayUnit: customDispUnit
        }
      ]);
    }

    // Auto-focus weight field for rapid cashier entry
    setItemFocusTrigger({ id: product._id, time: Date.now() });
    showToast(`Added "${product.name}" (${customQty} ${getUnitRateLabel(product.unit)}) to bill`);
  };

  const updateCartQty = (productId, newQtyRaw, silent = false) => {
    const parsed = Number(newQtyRaw);
    if (isNaN(parsed) || parsed <= 0) {
      if (!silent) removeFromCart(productId);
      return;
    }
    const cleanQty = Math.round(parsed * 1000) / 1000;
    const prod = products.find((p) => p._id === productId);
    if (prod && cleanQty > (prod.stockCount || 50)) {
      if (!silent) showToast(`Only ${prod.stockCount} ${prod.unit || 'units'} in stock`, 'error');
      return;
    }
    setCart((prev) => prev.map((item) => (item._id === productId ? { ...item, qty: cleanQty } : item)));
  };

  // Update item unit and automatically adjust display / billing unit & price
  const updateCartItemUnit = (productId, newSelectedUnit) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item._id !== productId) return item;
        const baseNorm = normalizeUnit(item.unit);
        // If switching between g and kg on a kg-based item, keep base unit 'kg' and toggle displayUnit
        if ((newSelectedUnit === 'g' || newSelectedUnit === 'kg') && baseNorm === 'kg') {
          return {
            ...item,
            displayUnit: newSelectedUnit
          };
        }
        // If switching to another unit (e.g. piece, pack, box, litre, or switching a piece item to kg/g)
        const updatedBaseUnit = newSelectedUnit === 'g' ? 'kg' : newSelectedUnit;
        return {
          ...item,
          unit: updatedBaseUnit,
          displayUnit: newSelectedUnit
        };
      })
    );
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
  const updateItemPrice = (productId, newPriceRaw, silent = false) => {
    if (!canEditPrice) {
      if (!silent) showToast('Permission denied: Only admin and staff can change billing price', 'error');
      return;
    }

    const parsed = Number(newPriceRaw);
    if (newPriceRaw === '' || isNaN(parsed) || parsed <= 0) {
      if (!silent) showToast('Please enter a valid positive billing price', 'error');
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

    if (!silent) {
      showToast(`Price set to ₹${roundedPrice} for current bill`);
    }
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
          const isWeight = isWeightedUnit(item.unit) || Boolean(item.isWeightBased);
          const weightInGrams = isWeight ? Math.round(cleanQty * 1000) : undefined;
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
            unit: item.unit || 'piece',
            isWeightBased: isWeight,
            weightInGrams
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
          {/* Search & Barcode Bar with Live Product Suggestions */}
          <div ref={searchContainerRef} className="relative z-30">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Scan barcode, or search product name / SKU for instant suggestions..."
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setShowSuggestions(true);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setHighlightedSuggestionIdx(0);
                    setShowSuggestions(val.trim().length > 0);
                  }}
                  onKeyDown={(e) => {
                    if (showSuggestions && searchSuggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setHighlightedSuggestionIdx((prev) =>
                          prev + 1 < searchSuggestions.length ? prev + 1 : 0
                        );
                        return;
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setHighlightedSuggestionIdx((prev) =>
                          prev - 1 >= 0 ? prev - 1 : searchSuggestions.length - 1
                        );
                        return;
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setShowSuggestions(false);
                        return;
                      }
                    }
                    if (e.key === 'ArrowDown' && cart.length > 0) {
                      e.preventDefault();
                      handleNavigateCartItem(0);
                    }
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>

            {/* Live Product Search Suggestion Dropdown */}
            {showSuggestions && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-40 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Instant Product Suggestions ({searchSuggestions.length})</span>
                  <span>↑↓ Navigate • Enter to Add</span>
                </div>
                {searchSuggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No matching products found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {searchSuggestions.map((item, idx) => {
                      const isHighlighted = idx === highlightedSuggestionIdx;
                      const isW = isWeightedUnit(item.unit);
                      const uLabel = getUnitRateLabel(item.unit);
                      return (
                        <div
                          key={item._id}
                          onClick={() => {
                            addToCart(item);
                            setSearchQuery('');
                            setShowSuggestions(false);
                            searchInputRef.current?.focus();
                          }}
                          className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isHighlighted ? 'bg-emerald-50/90' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500">
                                <span className="capitalize bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                                  {item.category}
                                </span>
                                {item.barcode && (
                                  <span className="font-mono text-slate-400">#{item.barcode}</span>
                                )}
                                <span className="text-emerald-700 font-semibold">
                                  Stock: {item.stockCount ?? 50} {uLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Custom Unit Add Buttons inside Search Suggestion */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isW && (
                              <div
                                className="hidden sm:flex items-center gap-1 mr-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {[
                                  { label: '250g', qty: 0.25, disp: 'g' },
                                  { label: '500g', qty: 0.5, disp: 'g' },
                                  { label: '1kg', qty: 1, disp: 'kg' }
                                ].map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                      addToCart(item, {
                                        qty: preset.qty,
                                        displayUnit: preset.disp
                                      });
                                      setSearchQuery('');
                                      setShowSuggestions(false);
                                      searchInputRef.current?.focus();
                                    }}
                                    className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                                    title={`Add ${preset.label} (₹${Math.round(item.price * preset.qty * 100) / 100})`}
                                  >
                                    {preset.label} (₹{Math.round(item.price * preset.qty * 100) / 100})
                                  </button>
                                ))}
                              </div>
                            )}
                            <div className="text-right">
                              <span className="text-xs font-black text-slate-900 block">
                                ₹{item.price}
                                <span className="text-[10px] font-normal text-slate-500">/{uLabel}</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

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
              All ({displayedProducts.length})
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
            ) : displayedProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                No items found for this query or category.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2.5">
                {displayedProducts.map((p) => {
                  const stock = p.stockCount !== undefined ? p.stockCount : 50;
                  const inCart = cart.find((it) => it._id === p._id);
                  const isW = isWeightedUnit(p.unit);
                  const cardSel = cardUnitSelections[p._id] || {
                    qty: 1,
                    displayUnit: isW ? 'kg' : normalizeUnit(p.unit),
                    label: isW ? '1kg' : `1 ${getUnitRateLabel(p.unit)}`
                  };
                  const liveCardPrice = Math.round(Number(p.price || 0) * cardSel.qty * 100) / 100;

                  return (
                    <div
                      key={p._id}
                      onClick={() =>
                        addToCart(p, {
                          qty: cardSel.qty,
                          displayUnit: cardSel.displayUnit
                        })
                      }
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
                            {inCart.qty} {getUnitRateLabel(inCart.unit)} in bill
                          </span>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[10px] font-mono">
                          Stock: {stock}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>

                      {/* Custom Unit Selector Pills on Card — Simultaneously Updates Displayed Price */}
                      <div
                        className="flex items-center gap-1 mt-1 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isW ? (
                          [
                            { label: '250g', qty: 0.25, displayUnit: 'g' },
                            { label: '500g', qty: 0.5, displayUnit: 'g' },
                            { label: '1kg', qty: 1, displayUnit: 'kg' }
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() =>
                                setCardUnitSelections((prev) => ({
                                  ...prev,
                                  [p._id]: opt
                                }))
                              }
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                                Math.abs(cardSel.qty - opt.qty) < 0.001
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))
                        ) : (
                          [
                            { label: '1 pc', qty: 1, displayUnit: 'piece' },
                            { label: 'Pack (2)', qty: 2, displayUnit: 'pack' },
                            { label: 'Box (6)', qty: 6, displayUnit: 'box' }
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() =>
                                setCardUnitSelections((prev) => ({
                                  ...prev,
                                  [p._id]: opt
                                }))
                              }
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
                                Math.abs(cardSel.qty - opt.qty) < 0.001
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-xs sm:text-sm font-black text-emerald-700">
                            ₹{liveCardPrice}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 ml-1">
                            ({cardSel.label})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs hover:bg-emerald-700 active:scale-90 transition-transform cursor-pointer"
                          title={`Add ${cardSel.label} for ₹${liveCardPrice}`}
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
                    <th className="py-2 px-1 text-center">Qty / Unit</th>
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
                      onUpdateUnit={updateCartItemUnit}
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

