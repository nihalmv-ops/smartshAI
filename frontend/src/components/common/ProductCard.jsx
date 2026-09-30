import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Plus, Minus, Check, Scale, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { isWeightProduct, isVolumeProduct, calculateWeightPrice, formatWeight } from '../../utils/weightUtils';

export const ProductCard = ({ product, onSelectProduct }) => {
  const navigate = useNavigate();
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const prodId = product._id || product.id;
  const isFav = isInWishlist(prodId);
  const cartItem = cart.find(item => item.id === prodId || item._id === prodId);
  const inCartQty = cartItem ? cartItem.quantity : 0;
  const isWeight = isWeightProduct(product);
  const isVolume = isVolumeProduct(product);

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedGrams, setSelectedGrams] = useState(1000);
  const [unit, setUnit] = useState('kg');
  const [weightVal, setWeightVal] = useState('1');
  const [customPackMultiplier, setCustomPackMultiplier] = useState(1);
  const [customUnitLabel, setCustomUnitLabel] = useState(product.unit || '1 pc');

  // Handle card click
  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
    if (onSelectProduct) {
      onSelectProduct({ ...product, id: prodId, _id: prodId });
    } else {
      navigate(`/products/${prodId}`);
    }
  };

  // Live dynamic price displayed on the card based on selected custom unit/weight
  const liveCardPrice = isWeight || isVolume
    ? calculateWeightPrice(product.price, selectedGrams, 1)
    : Math.round(Number(product.price || 0) * customPackMultiplier * 100) / 100;

  const liveCardOriginalPrice =
    product.originalPrice && product.originalPrice > product.price
      ? isWeight || isVolume
        ? calculateWeightPrice(product.originalPrice, selectedGrams, 1)
        : Math.round(Number(product.originalPrice) * customPackMultiplier * 100) / 100
      : null;

  const handleCardQuickWeightSelect = (grams, u, valStr) => {
    setSelectedGrams(grams);
    setUnit(u);
    setWeightVal(valStr);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-100 shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
    >
      {/* Top Badges & Wishlist */}
      <div className="flex items-center justify-between gap-1 z-10">
        {product.badge ? (
          <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold rounded-lg bg-brand-50 text-brand-600 border border-brand-100 truncate max-w-[80px] sm:max-w-none">
            {product.badge}
          </span>
        ) : (
          <div></div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`p-1.5 sm:p-2 rounded-full transition-all cursor-pointer ${
            isFav 
              ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' 
              : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
          }`}
          title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <div className="relative w-full h-28 sm:h-36 md:h-44 my-2 sm:my-3 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50/50">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-500 mix-blend-multiply p-1 sm:p-2"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-800 text-white text-[10px] sm:text-xs font-bold rounded-lg uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="space-y-1 sm:space-y-1.5 flex-1 flex flex-col justify-end">
        {/* Title */}
        <h3 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Inline Custom Unit Selector on Card — Changes Product Price Simultaneously */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="pt-0.5 space-y-1"
        >
          {isWeight || isVolume ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { label: isVolume ? '250ml' : '100g', grams: isVolume ? 250 : 100, u: isVolume ? 'ml' : 'g', val: isVolume ? '250' : '100' },
                  { label: isVolume ? '500ml' : '250g', grams: isVolume ? 500 : 250, u: isVolume ? 'ml' : 'g', val: isVolume ? '500' : '250' },
                  { label: isVolume ? '750ml' : '500g', grams: isVolume ? 750 : 500, u: isVolume ? 'ml' : 'g', val: isVolume ? '750' : '500' },
                  { label: isVolume ? '1L' : '1kg', grams: 1000, u: isVolume ? 'L' : 'kg', val: '1' }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleCardQuickWeightSelect(opt.grams, opt.u, opt.val)}
                    className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer ${
                      selectedGrams === opt.grams
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowWeightModal(true)}
                  className="px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 cursor-pointer"
                  title="Enter custom exact weight or custom price"
                >
                  Custom
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { label: product.unit || '1 pc', mult: 1 },
                { label: 'Pack of 2', mult: 2 },
                { label: 'Box (5)', mult: 5 }
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setCustomPackMultiplier(opt.mult);
                    setCustomUnitLabel(opt.label);
                  }}
                  className={`px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer ${
                    customPackMultiplier === opt.mult
                      ? 'bg-brand-500 text-white border-brand-500 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rating Stars & Count */}
        <div className="flex items-center gap-1 sm:gap-1.5 py-0.5">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                  i < Math.floor(product.rating || 4.5)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200 fill-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-600">
            {product.rating}
          </span>
          <span className="text-[10px] sm:text-[11px] text-slate-400 hidden xs:inline">
            ({product.reviewsCount})
          </span>
        </div>

        {/* Dynamic Price (Updates Live with Custom Unit) & Cart Actions */}
        <div className="pt-2 flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-2 border-t border-slate-50 mt-1">
          <div>
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">
                ₹{liveCardPrice}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 py-0.2 rounded">
                {isWeight || isVolume ? formatWeight(selectedGrams, isVolume ? 'L' : 'kg') : customUnitLabel}
              </span>
              {liveCardOriginalPrice && liveCardOriginalPrice > liveCardPrice && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                  ₹{liveCardOriginalPrice}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 block">
              Rate: ₹{product.price}/{isWeight ? 'kg' : isVolume ? 'L' : product.unit || 'pc'}
            </span>
          </div>

          {/* Add to Cart Actions */}
          {isWeight || isVolume ? (
            <div className="flex items-center gap-1">
              <button
                disabled={!product.inStock}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({ ...product, id: prodId, _id: prodId }, 1, selectedGrams);
                }}
                className="w-full xs:w-auto px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                title={`Add ${formatWeight(selectedGrams)} for ₹${liveCardPrice}`}
              >
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{inCartQty > 0 ? 'Update' : 'Add'}</span>
              </button>
              <button
                disabled={!product.inStock}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWeightModal(true);
                }}
                className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                title="Custom exact weight or custom price"
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            inCartQty > 0 ? (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-between xs:justify-center bg-brand-500 text-white rounded-full p-0.5 sm:p-1 shadow-sm gap-1 sm:gap-2 self-stretch xs:self-auto"
              >
                <button
                  onClick={() => decreaseQuantity(prodId)}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full hover:bg-brand-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Decrease quantity"
                >
                  <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                </button>
                <span className="text-[11px] sm:text-xs font-bold px-1 min-w-[12px] text-center">
                  {inCartQty}
                </span>
                <button
                  onClick={() => increaseQuantity(prodId)}
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full hover:bg-brand-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="Increase quantity"
                >
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                disabled={!product.inStock}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({ ...product, id: prodId, _id: prodId }, customPackMultiplier);
                }}
                className="w-full xs:w-auto px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-xs hover:shadow-md cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Fast Custom Weight & Simultaneous Price Selector Modal */}
      {showWeightModal && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setShowWeightModal(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate max-w-[180px]">
                    {product.name}
                  </h3>
                  <p className="text-xs text-emerald-700 font-bold">₹{product.price} / kg</p>
                </div>
              </div>
              <button
                onClick={() => setShowWeightModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Weight Select Buttons */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Quick Unit Select:</label>
              <div className="grid grid-cols-4 gap-1.5">
                {['100g', '250g', '500g', '1kg'].map((q) => {
                  const grams = q === '1kg' ? 1000 : parseInt(q);
                  const isSelected = selectedGrams === grams;
                  return (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setSelectedGrams(grams);
                        if (q === '1kg') {
                          setUnit('kg');
                          setWeightVal('1');
                        } else {
                          setUnit('g');
                          setWeightVal(grams.toString());
                        }
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Weight Input + Simultaneous Target Price Input */}
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Custom Weight &amp; Unit:</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={weightVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWeightVal(val);
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > 0) {
                          setSelectedGrams(unit === 'kg' ? Math.round(num * 1000) : Math.round(num));
                        }
                      }}
                      placeholder={unit === 'kg' ? '3.073' : '127'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="flex rounded-xl border border-slate-300 bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseFloat(weightVal);
                        if (unit === 'g') {
                          setUnit('kg');
                          if (!isNaN(num) && num > 0) {
                            setWeightVal((Math.round((num / 1000) * 1000) / 1000).toString());
                          }
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        unit === 'kg' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const num = parseFloat(weightVal);
                        if (unit === 'kg') {
                          setUnit('g');
                          if (!isNaN(num) && num > 0) {
                            setWeightVal(Math.round(num * 1000).toString());
                          }
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        unit === 'g' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      g
                    </button>
                  </div>
                </div>
              </div>

              {/* Simultaneous Custom Price Entry (Auto-calculates exact weight from target ₹) */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Or Enter Target Price (₹) — Auto-calculates Weight:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-700">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={calculateWeightPrice(product.price, selectedGrams, 1)}
                    onChange={(e) => {
                      const targetRupees = parseFloat(e.target.value);
                      if (!isNaN(targetRupees) && targetRupees > 0 && product.price > 0) {
                        const computedGrams = Math.max(1, Math.round((targetRupees / product.price) * 1000));
                        setSelectedGrams(computedGrams);
                        if (unit === 'kg') {
                          setWeightVal((computedGrams / 1000).toFixed(3).replace(/\.?0+$/, ''));
                        } else {
                          setWeightVal(computedGrams.toString());
                        }
                      }
                    }}
                    className="w-full pl-7 pr-3 py-2 bg-emerald-50/60 border border-emerald-300 rounded-xl text-sm font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Automatic Calculation & Total Breakdown */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Measured Weight:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedGrams >= 1000 
                      ? `${(selectedGrams / 1000).toFixed(3).replace(/\.?0+$/, '')} kg (${selectedGrams} g)` 
                      : `${selectedGrams} g (0.${selectedGrams.toString().padStart(3, '0')} kg)`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rate:</span>
                  <span className="font-bold text-slate-700">₹{product.price} / kg</span>
                </div>
                <div className="pt-1 border-t border-emerald-200/80 flex justify-between items-baseline">
                  <span className="font-black text-emerald-950">Total Price:</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    ₹{calculateWeightPrice(product.price, selectedGrams, 1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Add To Cart Action */}
            <button
              type="button"
              onClick={() => {
                addToCart({ ...product, id: prodId, _id: prodId }, 1, selectedGrams);
                setShowWeightModal(false);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>ADD TO CART • ₹{calculateWeightPrice(product.price, selectedGrams, 1)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
