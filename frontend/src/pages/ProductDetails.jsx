import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus, 
  Truck, 
  ShieldCheck, 
  RefreshCw, 
  Check, 
  ChevronRight,
  ArrowLeft,
  Share2
} from 'lucide-react';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/common/ProductCard';

export const ProductDetails = ({ productId: propProductId, navigateTo: propNavigateTo, onSelectProduct }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const targetId = propProductId || paramId;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedPack, setSelectedPack] = useState('1 Pack');
  const [activeTab, setActiveTab] = useState('description');

  const { addToCart, updateQuantity, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    let isMounted = true;
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const prod = await productService.getProductById(targetId);
        if (isMounted && prod) {
          setProduct(prod);
          setSelectedPack(prod.unit || '1 Pack');
          setQuantity(1);
          const all = await productService.getAllProducts();
          const rel = productService.getRelatedProducts(prod.id || prod._id, prod.category, all.products, 4);
          setRelatedProducts(rel);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductDetails();
    return () => { isMounted = false; };
  }, [targetId]);

  const navigateTo = (page, params = {}) => {
    if (propNavigateTo) {
      propNavigateTo(page, params);
    }
    if (page === 'home') navigate('/');
    else if (page === 'products') {
      const q = new URLSearchParams();
      if (params.category && params.category !== 'all') q.set('category', params.category);
      if (params.searchQuery) q.set('search', params.searchQuery);
      const str = q.toString();
      navigate(str ? `/products?${str}` : '/products');
    }
    else if (page === 'product-details') {
      navigate(`/products/${params.productId}`);
    }
    else {
      navigate(`/${page}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-[#F8FAFC] text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested product could not be located in our catalog.</p>
        <button
          onClick={() => navigateTo('products')}
          className="px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-500/25"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const isFav = isInWishlist(product.id || product._id);
  const cartItem = cart.find(i => (i.id === product.id || i._id === (product._id || product.id)));
  const inCartQty = cartItem ? cartItem.quantity : 0;

  const packOptions = [
    product.unit,
    product.unit?.includes('1') ? product.unit.replace('1', '2') : `Double Pack (2x)`
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs & Back */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <button onClick={() => navigateTo('home')} className="hover:text-brand-600">Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button 
              onClick={() => navigateTo('products', { category: product.category })} 
              className="hover:text-brand-600 capitalize"
            >
              {product.category}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-semibold truncate max-w-xs">{product.name}</span>
          </div>

          <button
            onClick={() => navigateTo('products')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </button>
        </div>

        {/* Main Product Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-soft mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* Left: Product Image Showcase */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-full aspect-square max-w-md bg-slate-50/80 rounded-3xl p-8 flex items-center justify-center border border-slate-100 overflow-hidden group">
                <img
                  src={product.image}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
                {product.badge && (
                  <span className="absolute top-4 left-4 px-3 py-1.5 text-xs font-bold rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                    {product.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Details & Purchase Actions */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Category & Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
                    {product.category}
                  </span>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-2.5 rounded-full border transition-all ${
                      isFav 
                        ? 'bg-rose-50 border-rose-200 text-rose-500' 
                        : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {product.name}
                </h1>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200 fill-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{product.rating}</span>
                  <span className="text-xs text-slate-400">({product.reviewsCount} verified reviews)</span>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{product.inStock ? 'In Stock (Farm Fresh)' : 'Out of Stock'}</span>
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-base text-slate-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Inclusive of all local taxes</p>
                </div>

                {product.originalPrice && (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-xl">
                    Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>

              {/* Pack Size Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Pack Size</label>
                <div className="flex flex-wrap gap-3">
                  {packOptions.map((pack) => (
                    <button
                      key={pack}
                      onClick={() => setSelectedPack(pack)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedPack === pack
                          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {pack}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Stepper & Add to Cart */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <div className="flex items-center justify-between sm:justify-center border border-slate-200 rounded-2xl p-1 bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-xs transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-slate-900 text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center text-slate-700 shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product, quantity)}
                  disabled={!product.inStock}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 active:scale-98 disabled:bg-slate-200 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/25 transition-all"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add {quantity > 1 ? `${quantity} Items` : 'to Cart'} • ₹{product.price * quantity}</span>
                </button>
              </div>

              {/* Delivery Assurance */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                  <Truck className="w-4 h-4 text-brand-500" />
                  <span>15-30 mins delivery</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Farm freshness checked</span>
                </div>
              </div>

            </div>

          </div>

          {/* Nutritional Info & Description Tabs */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <div className="flex gap-6 border-b border-slate-100 mb-6">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === 'description'
                    ? 'text-brand-600 border-b-2 border-brand-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Description &amp; Highlights
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeTab === 'nutrition'
                    ? 'text-brand-600 border-b-2 border-brand-500'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Nutritional Values
              </button>
            </div>

            {activeTab === 'description' ? (
              <div className="space-y-4 max-w-3xl text-sm text-slate-600 leading-relaxed">
                <p>{product.description}</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Hygienically packed under clean controlled environments.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>No artificial preservatives or ripening agents used.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Direct farm partner sourcing ensuring maximum shelf life.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Stored at optimal temperature throughout transit.</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="max-w-md">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Nutrition Facts per 100g / serving
                  </h4>
                  <div className="divide-y divide-slate-200/60 text-sm">
                    {product.nutrition && Object.entries(product.nutrition).map(([key, val]) => (
                      <div key={key} className="py-2 flex items-center justify-between">
                        <span className="capitalize text-slate-600 font-medium">{key}</span>
                        <span className="font-bold text-slate-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Related Products You May Like
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map(rel => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  onSelectProduct={(p) => {
                    if (onSelectProduct) onSelectProduct(p);
                    navigate(`/products/${p.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
