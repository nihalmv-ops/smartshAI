import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const navigate = useNavigate();
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const prodId = product._id || product.id;
  const isFav = isInWishlist(prodId);
  const cartItem = cart.find(item => item.id === prodId || item._id === prodId);
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const handleCardClick = (e) => {
    // Avoid triggering card navigation when clicking interactive buttons
    if (e.target.closest('button')) return;
    if (onSelectProduct) {
      onSelectProduct({ ...product, id: prodId, _id: prodId });
    } else {
      navigate(`/products/${prodId}`);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl p-4 border border-slate-100 shadow-soft hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
    >
      {/* Top Badges & Wishlist */}
      <div className="flex items-center justify-between gap-2 z-10">
        {product.badge ? (
          <span className="inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-50 text-brand-600 border border-brand-100">
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
          className={`p-2 rounded-full transition-all ${
            isFav 
              ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' 
              : 'bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
          }`}
          title={isFav ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <div className="relative w-full h-44 my-3 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50/50">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-500 mix-blend-multiply p-2"
          loading="lazy"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
            <span className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-end">
        {/* Title */}
        <h3 className="font-bold text-slate-800 text-sm group-hover:text-brand-600 transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Unit */}
        <p className="text-xs text-slate-500 font-medium">
          {product.unit}
        </p>

        {/* Rating Stars & Count */}
        <div className="flex items-center gap-1.5 py-0.5">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < Math.floor(product.rating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-200 fill-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {product.rating}
          </span>
          <span className="text-[11px] text-slate-400">
            ({product.reviewsCount})
          </span>
        </div>

        {/* Price & Cart Actions */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-50 mt-1">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900 tracking-tight">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through font-medium">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            {product.originalPrice && (
              <span className="text-[10px] font-bold text-emerald-600 block">
                Save ₹{product.originalPrice - product.price}
              </span>
            )}
          </div>

          {/* Add to Cart or Stepper */}
          {inCartQty > 0 ? (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-brand-500 text-white rounded-full p-1 shadow-sm gap-2"
            >
              <button
                onClick={() => decreaseQuantity(prodId)}
                className="w-6 h-6 rounded-full hover:bg-brand-600 flex items-center justify-center transition-colors"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-xs font-bold px-1 min-w-[12px] text-center">
                {inCartQty}
              </span>
              <button
                onClick={() => increaseQuantity(prodId)}
                className="w-6 h-6 rounded-full hover:bg-brand-600 flex items-center justify-center transition-colors"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              disabled={!product.inStock}
              onClick={(e) => {
                e.stopPropagation();
                addToCart({ ...product, id: prodId, _id: prodId }, 1);
              }}
              className="px-3.5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md"
            >
              <ShoppingCart className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Add to Cart</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
