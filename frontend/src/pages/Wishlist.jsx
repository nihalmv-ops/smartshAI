import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export const Wishlist = ({ navigateTo: propNavigateTo, onSelectProduct: propOnSelectProduct }) => {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const navigateTo = (page, params = {}) => {
    if (propNavigateTo) {
      propNavigateTo(page, params);
    }
    if (page === 'home') navigate('/');
    else if (page === 'products') navigate('/products');
    else navigate(`/${page}`);
  };

  const handleSelectProduct = (product) => {
    if (propOnSelectProduct) {
      propOnSelectProduct(product);
    }
    navigate(`/products/${product.id}`);
  };

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[#F8FAFC]">
        <div className="w-24 h-24 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Your Wishlist is Empty</h2>
        <p className="text-sm text-slate-500 max-w-md text-center mb-8">
          Save your favorite daily essentials, snacks and fruits to keep track of seasonal discounts.
        </p>
        <button
          onClick={() => navigateTo('products')}
          className="px-8 py-3.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all active:scale-95"
        >
          <span>Discover Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Saved Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={clearWishlist}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold"
            >
              Clear All
            </button>
            <button
              onClick={() => navigateTo('products')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Store</span>
            </button>
          </div>
        </div>

        {/* Wishlist Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-soft flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                    {product.category}
                  </span>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-full transition-colors"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div 
                  onClick={() => handleSelectProduct(product)}
                  className="w-full h-40 flex items-center justify-center my-3 cursor-pointer overflow-hidden rounded-xl bg-slate-50/50"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-108 transition-transform duration-300"
                  />
                </div>

                <h3 
                  onClick={() => handleSelectProduct(product)}
                  className="font-bold text-slate-900 text-sm hover:text-brand-600 cursor-pointer line-clamp-1"
                >
                  {product.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{product.unit}</p>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-lg font-black text-slate-900">₹{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
              </div>

              {/* Move to Cart Action */}
              <div className="pt-4 mt-2 border-t border-slate-100">
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
