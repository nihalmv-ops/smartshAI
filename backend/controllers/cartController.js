import Cart from '../models/Cart.js';

// @desc    Get user's shopping cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({
      success: true,
      cart: cart.items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save / Sync user's shopping cart
// @route   POST /api/cart
// @access  Private
export const saveCart = async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      res.status(400);
      throw new Error('Items must be an array of cart items');
    }

    // Format items to store product ID and quantity
    const formattedItems = items
      .filter(item => item && (item.product || item._id || item.id))
      .map(item => ({
        product: item.product || item._id || item.id,
        quantity: Math.max(1, Number(item.quantity) || 1)
      }));

    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = formattedItems;
      await cart.save();
    } else {
      cart = await Cart.create({
        user: req.user._id,
        items: formattedItems
      });
    }

    const populatedCart = await Cart.findById(cart._id).populate('items.product');

    res.json({
      success: true,
      message: 'Cart synced successfully',
      cart: populatedCart.items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear user's shopping cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

