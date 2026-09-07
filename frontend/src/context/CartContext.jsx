import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('smartmart_cart');
      return savedCart ? JSON.parse(savedCart) : [
        {
          id: '6a9ceb55ee1d36070043e1ed_mock1',
          name: 'Amul Fresh Milk',
          category: 'dairy',
          unit: '1 Litre',
          price: 35,
          originalPrice: 40,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: '6a9ceb55ee1d36070043e1ed_mock2',
          name: 'Fresh Farm Tomatoes',
          category: 'vegetables',
          unit: '1 kg',
          price: 40,
          originalPrice: 50,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80'
        }
      ];
    } catch (e) {
      console.error('Error loading cart from localStorage:', e);
      return [];
    }
  });

  const [coupon, setCoupon] = useState({ code: '', discountPercent: 0 });
  const [toastMessage, setToastMessage] = useState(null);
  const isSyncingRef = useRef(false);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('smartmart_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  }, [cart]);

  // Sync with backend on authentication changes
  useEffect(() => {
    const syncWithBackend = async () => {
      if (isAuthenticated) {
        try {
          const res = await cartService.getCart();
          if (res.success && Array.isArray(res.cart) && res.cart.length > 0) {
            // Map backend cart format
            const backendItems = res.cart
              .filter(item => item && item.product)
              .map(item => ({
                id: item.product._id || item.product.id,
                _id: item.product._id || item.product.id,
                name: item.product.name,
                category: item.product.category,
                unit: item.product.unit,
                price: item.product.price,
                originalPrice: item.product.originalPrice || item.product.price,
                quantity: item.quantity,
                image: item.product.image
              }));

            // Merge with local cart (combining quantities for shared items)
            setCart(localPrev => {
              const combined = [...localPrev];
              for (const bItem of backendItems) {
                const idx = combined.findIndex(c => (c.id === bItem.id || c._id === bItem.id));
                if (idx > -1) {
                  combined[idx].quantity = Math.max(combined[idx].quantity, bItem.quantity);
                } else {
                  combined.push(bItem);
                }
              }
              return combined;
            });
          } else if (cart.length > 0) {
            // If backend has no cart but local user had items before login, save them to backend!
            await cartService.saveCart(cart);
          }
        } catch (err) {
          console.warn('Cart initial backend sync notice:', err.message);
        }
      }
    };

    syncWithBackend();
  }, [isAuthenticated, user?._id]);

  // Auto-sync cart to backend when modified by authenticated user (debounced)
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(async () => {
      try {
        isSyncingRef.current = true;
        await cartService.saveCart(cart);
      } catch (err) {
        console.warn('Backend cart auto-save notice:', err.message);
      } finally {
        isSyncingRef.current = false;
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [cart, isAuthenticated]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Add products to cart
  const addToCart = (product, quantity = 1) => {
    const prodId = product._id || product.id;
    setCart(prev => {
      const existing = prev.find(item => (item.id === prodId || item._id === prodId));
      if (existing) {
        return prev.map(item =>
          (item.id === prodId || item._id === prodId)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        id: prodId,
        _id: prodId,
        quantity 
      }];
    });
    showToast(`Added ${quantity > 1 ? quantity + 'x ' : ''}${product.name} to cart!`);
  };

  // Remove products from cart
  const removeFromCart = (productId) => {
    const item = cart.find(i => (i.id === productId || i._id === productId));
    setCart(prev => prev.filter(i => (i.id !== productId && i._id !== productId)));
    if (item) {
      showToast(`Removed ${item.name} from cart`, 'info');
    }
  };

  // Increase quantity
  const increaseQuantity = (productId) => {
    updateQuantity(productId, 1);
  };

  // Decrease quantity
  const decreaseQuantity = (productId) => {
    updateQuantity(productId, -1);
  };

  // Update quantity (+ / -)
  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.id === productId || item._id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  // Clear all items from cart
  const clearCart = () => {
    setCart([]);
    setCoupon({ code: '', discountPercent: 0 });
    if (isAuthenticated) {
      cartService.clearCart().catch(() => {});
    }
  };

  // Coupon management
  const applyCoupon = (code) => {
    const normalized = code.trim().toUpperCase();
    if (normalized === 'SMART10') {
      setCoupon({ code: 'SMART10', discountPercent: 10 });
      showToast('Coupon SMART10 applied! 10% off', 'success');
      return { success: true, message: '10% discount applied!' };
    } else if (normalized === 'FRESH20') {
      setCoupon({ code: 'FRESH20', discountPercent: 20 });
      showToast('Coupon FRESH20 applied! 20% off', 'success');
      return { success: true, message: '20% discount applied!' };
    } else {
      showToast('Invalid coupon code. Try SMART10 or FRESH20', 'error');
      return { success: false, message: 'Invalid coupon code. Try SMART10 or FRESH20' };
    }
  };

  const removeCoupon = () => {
    setCoupon({ code: '', discountPercent: 0 });
    showToast('Coupon removed', 'info');
  };

  // Calculations
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const originalSubtotal = cart.reduce(
    (acc, item) => acc + (item.originalPrice || item.price) * item.quantity,
    0
  );
  const itemsDiscount = originalSubtotal - subtotal;
  const couponDiscount = Math.round((subtotal * coupon.discountPercent) / 100);
  const deliveryFee = subtotal > 199 || subtotal === 0 ? 0 : 25;
  const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        updateQuantity,
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
        finalTotal,
        toastMessage
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
