import Order from '../models/Order.js';
import Product from '../models/Product.js';
import DailyRegister from '../models/DailyRegister.js';

// @desc    Create new offline Point-of-Sale (POS) counter transaction
// @route   POST /api/pos/sale
// @access  Private (Staff / Admin)
export const createOfflineSale = async (req, res, next) => {
  try {
    const {
      items,
      paymentMethod = 'Cash',
      discount = 0,
      tax = 0,
      customerName = 'Walk-in Customer',
      customerPhone = '',
      amountTendered = 0,
      notes = ''
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400);
      throw new Error('POS transaction must contain at least one item');
    }

    // Look up all products from MongoDB for verified prices and costs
    const productIds = items.map((i) => i.product || i._id || i.id).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let calculatedItemsPrice = 0;
    let calculatedTotalCost = 0;

    const orderItems = items.map((item) => {
      const pId = (item.product || item._id || item.id || '').toString();
      const dbProduct = productMap.get(pId);

      const price = dbProduct ? Number(dbProduct.price) : Number(item.price || 0);
      const costPrice = dbProduct
        ? Number(dbProduct.costPrice || Math.round(price * 0.75))
        : Math.round(price * 0.75);
      const name = dbProduct ? dbProduct.name : item.name || 'Store Item';
      const category = dbProduct ? dbProduct.category : item.category || 'grocery';
      const unit = dbProduct ? dbProduct.unit : item.unit || 'pack';
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));

      calculatedItemsPrice += price * qty;
      calculatedTotalCost += costPrice * qty;

      return {
        product: dbProduct ? dbProduct._id : item.product || item._id,
        name,
        price,
        costPrice,
        category,
        unit,
        qty,
        image: dbProduct ? dbProduct.image : ''
      };
    });

    const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, calculatedItemsPrice));
    const safeTax = Math.max(0, Number(tax) || 0);
    const totalPrice = Math.max(0, calculatedItemsPrice - safeDiscount + safeTax);
    const grossProfit = Math.max(0, totalPrice - calculatedTotalCost);

    // Generate unique sequential formatted receipt number
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `POS-${todayStr}-${randSuffix}`;

    const order = new Order({
      orderItems,
      shippingAddress: {
        fullName: (customerName || 'Walk-in Customer').trim(),
        phone: (customerPhone || '-').trim(),
        address: 'Skyline Mart Physical Counter',
        city: 'Bengaluru',
        postalCode: '560038'
      },
      deliveryNotes: notes ? notes.trim() : '',
      orderChannel: 'offline',
      receiptNumber,
      staff: req.user ? req.user._id : undefined,
      paymentMethod,
      itemsPrice: calculatedItemsPrice,
      discount: safeDiscount,
      tax: safeTax,
      deliveryFee: 0,
      totalPrice,
      totalCost: calculatedTotalCost,
      grossProfit,
      status: 'Delivered',
      isPaid: true,
      paidAt: Date.now(),
      isDelivered: true,
      deliveredAt: Date.now()
    });

    const savedOrder = await order.save();

    // Atomically decrement stock in MongoDB for all purchased products
    for (const it of orderItems) {
      if (it.product) {
        const updated = await Product.findByIdAndUpdate(
          it.product,
          { $inc: { stockCount: -it.qty } },
          { new: true }
        );
        if (updated && updated.stockCount <= 0) {
          updated.inStock = false;
          await updated.save();
        }
      }
    }

    // If payment method was Cash, update today's cash register if active
    if (paymentMethod === 'Cash') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const reg = await DailyRegister.findOne({ date: todayStart, status: 'Open' });
      if (reg) {
        reg.cashSales = (reg.cashSales || 0) + totalPrice;
        await reg.save();
      }
    }

    const changeDue = Math.max(0, (Number(amountTendered) || totalPrice) - totalPrice);

    res.status(201).json({
      success: true,
      message: 'Offline sale recorded successfully',
      receipt: {
        receiptNumber,
        orderId: savedOrder._id,
        createdAt: savedOrder.createdAt,
        cashier: req.user ? req.user.name : 'Counter Staff',
        items: orderItems,
        subtotal: calculatedItemsPrice,
        discount: safeDiscount,
        tax: safeTax,
        total: totalPrice,
        paymentMethod,
        amountTendered: Number(amountTendered) || totalPrice,
        changeDue,
        customerName: (customerName || 'Walk-in Customer').trim(),
        customerPhone: customerPhone || ''
      },
      order: savedOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Fast search products for POS counter (by barcode, name, SKU, category)
// @route   GET /api/pos/products
// @access  Private (Staff / Admin)
export const getPosProducts = async (req, res, next) => {
  try {
    const { query = '', category = '' } = req.query;
    const filter = { inStock: true, stockCount: { $gt: 0 } };

    if (query && query.trim()) {
      const q = query.trim();
      filter.$or = [
        { barcode: q },
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }

    const products = await Product.find(filter)
      .select('name price costPrice category unit stockCount inStock image barcode taxRate')
      .sort({ name: 1 })
      .limit(100);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get shift summary for today's POS counter
// @route   GET /api/pos/shift-summary
// @access  Private (Staff / Admin)
export const getPosShiftSummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const agg = await Order.aggregate([
      {
        $match: {
          orderChannel: 'offline',
          createdAt: { $gte: todayStart },
          status: { $ne: 'Cancelled' }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalSales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalShiftSales = 0;
    let totalTransactions = 0;
    const paymentTotals = { Cash: 0, UPI: 0, Card: 0, Other: 0 };

    agg.forEach((item) => {
      const p = item._id || 'Other';
      const amt = item.totalSales || 0;
      totalShiftSales += amt;
      totalTransactions += item.count || 0;

      if (paymentTotals[p] !== undefined) {
        paymentTotals[p] += amt;
      } else {
        paymentTotals.Other += amt;
      }
    });

    res.json({
      success: true,
      totalShiftSales: Math.round(totalShiftSales),
      totalTransactions,
      paymentTotals
    });
  } catch (error) {
    next(error);
  }
};
