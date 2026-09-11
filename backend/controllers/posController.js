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

    // Authorization check: Only staff and admin can create offline POS sales and override prices
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      res.status(403);
      throw new Error('Access denied: Only authorized admin and staff can create offline sales');
    }

    // Generate unique sequential formatted receipt number
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `OFF-${todayStr}-${randSuffix}`;

    // Look up all products from MongoDB for verified catalog prices and costs
    const productIds = items.map((i) => i.product || i._id || i.id).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let calculatedItemsPrice = 0;
    let calculatedTotalCost = 0;
    const priceOverrideAudit = [];

    const orderItems = items.map((item) => {
      const pId = (item.product || item._id || item.id || '').toString();
      const dbProduct = productMap.get(pId);

      if (!dbProduct) {
        res.status(404);
        throw new Error(`Product not found in store catalog: ${item.name || pId}`);
      }

      const catalogPrice = Number(dbProduct.price || 0);
      const costPrice = Number(dbProduct.costPrice || Math.round(catalogPrice * 0.75));
      const name = dbProduct.name;
      const category = dbProduct.category || 'grocery';
      const unit = dbProduct.unit || 'pack';
      const qty = Math.max(1, Number(item.qty || item.quantity || 1));

      // Check for requested custom billing price
      let actualBillingPrice = catalogPrice;
      let isOverridden = false;

      const requestedPrice =
        item.billPrice !== undefined
          ? item.billPrice
          : item.billingPrice !== undefined
          ? item.billingPrice
          : item.sellingPrice !== undefined
          ? item.sellingPrice
          : item.price;

      if (requestedPrice !== undefined && requestedPrice !== null && requestedPrice !== '') {
        const parsedPrice = Number(requestedPrice);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          res.status(400);
          throw new Error(`Invalid billing price for product "${name}": must be a valid non-negative number`);
        }
        actualBillingPrice = Math.round(parsedPrice * 100) / 100;
        if (Math.abs(actualBillingPrice - catalogPrice) > 0.001) {
          isOverridden = true;
        }
      }

      const itemTotal = Math.round(actualBillingPrice * qty * 100) / 100;
      const itemCostTotal = Math.round(costPrice * qty * 100) / 100;

      calculatedItemsPrice += itemTotal;
      calculatedTotalCost += itemCostTotal;

      if (isOverridden) {
        priceOverrideAudit.push({
          product: dbProduct._id,
          productId: dbProduct._id,
          productName: name,
          originalPrice: catalogPrice,
          chargedPrice: actualBillingPrice,
          differencePerUnit: Math.round((actualBillingPrice - catalogPrice) * 100) / 100,
          qty,
          quantity: qty,
          changedBy: req.user._id,
          changedByName: req.user.name || 'Admin',
          date: new Date(),
          saleId: receiptNumber,
          receiptNumber
        });
      }

      return {
        product: dbProduct._id,
        productId: dbProduct._id,
        name,
        productName: name,
        originalPrice: catalogPrice,
        sellingPrice: actualBillingPrice,
        price: actualBillingPrice,
        costPrice,
        itemTotal,
        isPriceOverridden: isOverridden,
        category,
        unit,
        qty,
        quantity: qty,
        image: dbProduct.image || ''
      };
    });

    const safeDiscount = Math.max(0, Math.min(Number(discount) || 0, calculatedItemsPrice));
    const safeTax = Math.max(0, Number(tax) || 0);
    const totalPrice = Math.max(0, Math.round((calculatedItemsPrice - safeDiscount + safeTax) * 100) / 100);
    // Gross Profit = Selling Price Used - Purchase Cost
    const grossProfit = Math.max(0, Math.round((totalPrice - calculatedTotalCost) * 100) / 100);

    const order = new Order({
      orderItems,
      priceOverrideAudit,
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

    // Atomically decrement stock in MongoDB ONLY (Product price remains completely unchanged)
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
        priceOverrides: priceOverrideAudit,
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

