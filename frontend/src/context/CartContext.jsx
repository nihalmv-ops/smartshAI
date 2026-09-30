import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { cartService } from '../services/cartService';
import { settingsService, defaultSettings } from '../services/settingsService';
import { useAuth } from './AuthContext';
import { isWeightProduct, calculateWeightPrice, formatWeight } from '../utils/weightUtils';

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
          weightInGrams: 0,
          isWeightBased: false,
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
          weightInGrams: 1000,
          isWeightBased: true,
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
  const [settings, setSettings] = useState(defaultSettings);
  const isSyncingRef = useRef(false);

  // Fetch live store settings (delivery fee, free delivery threshold)
  useEffect(() => {
    let isMounted = true;
    settingsService.getSettings().then((data) => {
      if (isMounted && data) {
        setSettings(data);
      }
    }).catch((err) => {
      console.warn('Could not load live store settings:', err.message);
    });
    return () => {
      isMounted = false;
    };
  }, []);

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
                weightInGrams: item.weightInGrams !== undefined ? item.weightInGrams : (isWeightProduct(item.product) ? 1000 : 0),
                isWeightBased: isWeightProduct(item.product),
                image: item.product.image
              }));

            // Merge with local cart (combining quantities for shared items)
            setCart(localPrev => {
              const combined = [...localPrev];
              for (const bItem of backendItems) {
                const idx = combined.findIndex(c => (c.id === bItem.id || c._id === bItem.id));
                if (idx > -1) {
                  combined[idx].quantity = Math.max(combined[idx].quantity, bItem.quantity);
                  if (bItem.weightInGrams && !combined[idx].weightInGrams) {
                    combined[idx].weightInGrams = bItem.weightInGrams;
                  }
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

  // Add products to cart (with exact weight support)
  const addToCart = (product, quantity = 1, customWeightInGrams = null) => {
    const prodId = product._id || product.id;
    const isWeight = isWeightProduct(product);
    
    // Determine canonical weight in grams
    let finalWeight = 0;
    if (customWeightInGrams !== null && customWeightInGrams !== undefined) {
      finalWeight = Number(customWeightInGrams) || 0;
    } else if (product.weightInGrams) {
      finalWeight = Number(product.weightInGrams);
    } else if (isWeight) {
      finalWeight = 1000; // Default: 1 kg (1000g)
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => (item.id === prodId || item._id === prodId));
      if (existingIndex > -1) {
        return prev.map((item, idx) => {
          if (idx === existingIndex) {
            // If custom weight was specified during add, update the weight and add quantity
            return {
              ...item,
              quantity: item.quantity + quantity,
              weightInGrams: finalWeight > 0 ? finalWeight : item.weightInGrams
            };
          }
          return item;
        });
      }

      return [...prev, { 
        ...product, 
        id: prodId,
        _id: prodId,
        quantity,
        weightInGrams: finalWeight,
        isWeightBased: isWeight
      }];
    });

    const weightInfo = isWeight && finalWeight > 0 ? ` (${formatWeight(finalWeight)})` : '';
    showToast(`Added ${quantity > 1 ? quantity + 'x ' : ''}${product.name}${weightInfo} to cart!`);
  };

  // Update exact weight of an item directly in cart
  const updateItemWeight = (productId, newWeightInGrams) => {
    const cleanWeight = Math.max(1, Math.round(Number(newWeightInGrams) || 1));
    setCart(prev =>
      prev.map(item =>
        (item.id === productId || item._id === productId)
          ? { ...item, weightInGrams: cleanWeight }
          : item
      )
    );
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

  // Price calculations with exact weight support
  const getItemPrice = (item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    if (isWeightProduct(item) && Number(item.weightInGrams) > 0) {
      return calculateWeightPrice(item.price, item.weightInGrams, qty);
    }
    return Math.round(Number(item.price || 0) * qty * 100) / 100;
  };

  const getItemOriginalPrice = (item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const orig = item.originalPrice || item.price || 0;
    if (isWeightProduct(item) && Number(item.weightInGrams) > 0) {
      return calculateWeightPrice(orig, item.weightInGrams, qty);
    }
    return Math.round(Number(orig) * qty * 100) / 100;
  };

  const totalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const subtotal = Math.round(cart.reduce((acc, item) => acc + getItemPrice(item), 0) * 100) / 100;
  const originalSubtotal = Math.round(cart.reduce((acc, item) => acc + getItemOriginalPrice(item), 0) * 100) / 100;
  const itemsDiscount = Math.max(0, Math.round((originalSubtotal - subtotal) * 100) / 100);
  const couponDiscount = Math.round((subtotal * (coupon?.discountPercent || 0)) / 100);
  const freeDeliveryThreshold = settings.freeDeliveryThreshold ?? 199;
  const baseDeliveryFee = settings.deliveryFee ?? 25;
  const isFreeDelivery = subtotal === 0 || (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold);
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const finalTotal = Math.max(0, Math.round((subtotal - couponDiscount + deliveryFee) * 100) / 100);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateItemWeight,
        getItemPrice,
        getItemOriginalPrice,
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
        baseDeliveryFee,
        freeDeliveryThreshold,
        deliverySettings: settings,
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
