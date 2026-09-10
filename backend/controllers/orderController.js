import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Public / Optional Auth
export const createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      discount = 0,
      deliveryNotes = '',
      orderChannel = 'web',
      whatsappContact = null
    } = req.body;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items in cart');
    }

    // Retrieve product IDs to look up official prices in DB
    const productIds = orderItems
      .map((item) => item.product || item._id || item.id)
      .filter(Boolean);

    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    // Construct verified order items with official database prices
    let calculatedItemsPrice = 0;
    const verifiedOrderItems = orderItems.map((item) => {
      const pId = (item.product || item._id || item.id || '').toString();
      const dbProduct = productMap.get(pId);

      const itemPrice = dbProduct ? Number(dbProduct.price) : Number(item.price || 0);
      const itemName = dbProduct ? dbProduct.name : (item.name || 'Product');
      const itemImage = dbProduct ? dbProduct.image : (item.image || '');
      const itemUnit = dbProduct ? dbProduct.unit : (item.unit || '');
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));

      calculatedItemsPrice += itemPrice * qty;

      return {
        product: dbProduct ? dbProduct._id : item.product || item._id,
        name: itemName,
        image: itemImage,
        price: itemPrice,
        unit: itemUnit,
        qty
      };
    });

    // Fetch dynamic store delivery settings
    const settings = await Settings.getSettings();
    const freeThreshold = Number(settings.freeDeliveryThreshold) || 199;
    const standardFee = Number(settings.deliveryFee) || 25;

    const deliveryFee = calculatedItemsPrice >= freeThreshold ? 0 : standardFee;
    const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, calculatedItemsPrice));
    const totalPrice = Math.max(0, calculatedItemsPrice - safeDiscount + deliveryFee);

    const isWhatsApp = orderChannel === 'whatsapp';
    const initialStatus = isWhatsApp ? 'WhatsApp Pending' : 'Pending';

    const order = new Order({
      user: req.user ? req.user._id : undefined,
      orderItems: verifiedOrderItems,
      shippingAddress: {
        fullName: shippingAddress?.fullName || (req.user ? req.user.name : 'Customer'),
        address: shippingAddress?.address || (req.user ? req.user.address : 'Doorstep Delivery'),
        city: shippingAddress?.city || 'Bengaluru',
        postalCode: shippingAddress?.postalCode || '560038',
        phone: shippingAddress?.phone || (req.user ? req.user.phone : '')
      },
      deliveryNotes: deliveryNotes ? String(deliveryNotes).trim() : '',
      orderChannel: isWhatsApp ? 'whatsapp' : 'web',
      whatsappContact: whatsappContact || { name: '', phoneNumber: '' },
      paymentMethod: paymentMethod || 'Cash on Delivery',
      itemsPrice: calculatedItemsPrice,
      deliveryFee,
      discount: safeDiscount,
      totalPrice,
      status: initialStatus
    });

    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      message: isWhatsApp
        ? 'WhatsApp order created successfully. Ready for dispatch.'
        : 'Order placed successfully',
      order: createdOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name image price unit')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public / Optional Auth
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name image price unit');

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // If order is tied to a user and caller is authenticated, verify ownership or admin
    if (order.user && req.user) {
      const isOwner = order.user._id.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to view this order');
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private / Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'id name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private / Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const validStatuses = [
      'WhatsApp Pending',
      'Pending',
      'Confirmed',
      'Processing',
      'Preparing',
      'Ready',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    order.status = status;

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: `Order status updated to "${status}"`,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};
