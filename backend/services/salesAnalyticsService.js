import Order from '../models/Order.js';
import Expense from '../models/Expense.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// Statuses that contribute to official sales
const COMPLETED_STATUSES = [
  'Delivered',
  'Completed',
  'Confirmed',
  'Processing',
  'Preparing',
  'Ready',
  'Out for Delivery'
];

/**
 * Normalizes start and end of day dates
 */
const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Safe growth percentage formula
 * Formula: ((current - previous) / previous) * 100
 */
export const calculateGrowthPercentage = (current, previous) => {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;

  if (prev === 0) {
    return curr > 0 ? 100 : 0;
  }
  const growth = ((curr - prev) / prev) * 100;
  return Math.round(growth * 10) / 10;
};

export const salesAnalyticsService = {
  /**
   * Central sales calculation system
   * Calculates Today, Yesterday, This Week, This Month, This Year, Lifetime
   * Separated by Online, WhatsApp, Offline, and Total Sales
   */
  getSalesSummary: async () => {
    const now = new Date();

    // 1. Today
    const today = getDayBounds(now);

    // 2. Yesterday
    const yestDate = new Date(now);
    yestDate.setDate(yestDate.getDate() - 1);
    const yesterday = getDayBounds(yestDate);

    // 3. This Week (Monday to now)
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    // 4. This Month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // 5. This Year
    const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);

    // Helper aggregator for a given date range
    const aggregateSales = async (from = null, to = null) => {
      const match = {
        status: { $in: COMPLETED_STATUSES }
      };
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = from;
        if (to) match.createdAt.$lte = to;
      }

      const results = await Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalPrice' },
            totalOrders: { $sum: 1 },
            totalCost: { $sum: '$totalCost' },
            onlineSales: {
              $sum: {
                $cond: [
                  { $in: ['$orderChannel', ['online', 'web']] },
                  '$totalPrice',
                  0
                ]
              }
            },
            whatsAppSales: {
              $sum: {
                $cond: [{ $eq: ['$orderChannel', 'whatsapp'] }, '$totalPrice', 0]
              }
            },
            offlineSales: {
              $sum: {
                $cond: [{ $eq: ['$orderChannel', 'offline'] }, '$totalPrice', 0]
              }
            }
          }
        }
      ]);

      if (results.length === 0) {
        return {
          totalRevenue: 0,
          totalOrders: 0,
          totalCost: 0,
          grossProfit: 0,
          onlineSales: 0,
          whatsAppSales: 0,
          offlineSales: 0
        };
      }

      const row = results[0];
      const grossProfit = Math.max(0, (row.totalRevenue || 0) - (row.totalCost || 0));

      return {
        totalRevenue: Math.round(row.totalRevenue || 0),
        totalOrders: row.totalOrders || 0,
        totalCost: Math.round(row.totalCost || 0),
        grossProfit: Math.round(grossProfit),
        onlineSales: Math.round(row.onlineSales || 0),
        whatsAppSales: Math.round(row.whatsAppSales || 0),
        offlineSales: Math.round(row.offlineSales || 0)
      };
    };

    const [todaySales, yesterdaySales, weekSales, monthSales, yearSales, lifetimeSales] =
      await Promise.all([
        aggregateSales(today.start, today.end),
        aggregateSales(yesterday.start, yesterday.end),
        aggregateSales(weekStart, now),
        aggregateSales(monthStart, now),
        aggregateSales(yearStart, now),
        aggregateSales()
      ]);

    return {
      today: todaySales,
      yesterday: yesterdaySales,
      thisWeek: weekSales,
      thisMonth: monthSales,
      thisYear: yearSales,
      lifetime: lifetimeSales
    };
  },

  /**
   * Profit & Expenses calculations
   * Revenue, Cost of Goods (COGS), Gross Profit, Expenses, Net Profit, Margin %
   */
  getProfitMetrics: async (startDate, endDate) => {
    const match = {
      status: { $in: COMPLETED_STATUSES }
    };
    const expenseMatch = {};

    if (startDate || endDate) {
      match.createdAt = {};
      expenseMatch.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        match.createdAt.$gte = s;
        expenseMatch.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        match.createdAt.$lte = e;
        expenseMatch.date.$lte = e;
      }
    }

    // Aggregate Orders for Revenue and COGS
    const orderAgg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalCost: { $sum: '$totalCost' },
          totalOrders: { $sum: 1 },
          totalUnits: {
            $sum: {
              $reduce: {
                input: '$orderItems',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.qty'] }
              }
            }
          }
        }
      }
    ]);

    const rev = orderAgg.length > 0 ? orderAgg[0].totalRevenue || 0 : 0;
    const cogs = orderAgg.length > 0 ? orderAgg[0].totalCost || 0 : 0;
    const ordersCount = orderAgg.length > 0 ? orderAgg[0].totalOrders || 0 : 0;
    const unitsSold = orderAgg.length > 0 ? orderAgg[0].totalUnits || 0 : 0;

    // Gross Profit = Revenue - Cost of Goods Sold
    const grossProfit = Math.max(0, rev - cogs);
    const profitMargin = rev > 0 ? Math.round((grossProfit / rev) * 1000) / 10 : 0;
    const aov = ordersCount > 0 ? Math.round(rev / ordersCount) : 0;

    // Aggregate Expenses
    const expenseAgg = await Expense.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);
    const totalExpenses = expenseAgg.length > 0 ? expenseAgg[0].totalExpenses || 0 : 0;

    // Net Profit = Gross Profit - Business Expenses
    const netProfit = grossProfit - totalExpenses;
    const netMargin = rev > 0 ? Math.round((netProfit / rev) * 1000) / 10 : 0;

    return {
      revenue: Math.round(rev),
      cogs: Math.round(cogs),
      grossProfit: Math.round(grossProfit),
      profitMargin, // Gross margin %
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      netMargin, // Net margin %
      totalOrders: ordersCount,
      unitsSold,
      aov
    };
  },

  /**
   * Payment Analytics: Reconciles Cash, UPI, Card, Online, Other
   */
  getPaymentAnalytics: async (startDate, endDate) => {
    const match = {
      status: { $in: COMPLETED_STATUSES }
    };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const paymentAgg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);

    const breakdown = {
      Cash: { amount: 0, count: 0 },
      UPI: { amount: 0, count: 0 },
      Card: { amount: 0, count: 0 },
      'Online / NetBanking': { amount: 0, count: 0 },
      Other: { amount: 0, count: 0 }
    };

    let totalReconciled = 0;
    paymentAgg.forEach((item) => {
      const p = (item._id || '').toLowerCase();
      const amt = Math.round(item.totalAmount || 0);
      totalReconciled += amt;

      if (p.includes('cash') || p === 'cod') {
        breakdown.Cash.amount += amt;
        breakdown.Cash.count += item.count;
      } else if (p.includes('upi') || p.includes('gpay') || p.includes('phonepe')) {
        breakdown.UPI.amount += amt;
        breakdown.UPI.count += item.count;
      } else if (p.includes('card') || p.includes('credit') || p.includes('debit')) {
        breakdown.Card.amount += amt;
        breakdown.Card.count += item.count;
      } else if (p.includes('online') || p.includes('netbanking')) {
        breakdown['Online / NetBanking'].amount += amt;
        breakdown['Online / NetBanking'].count += item.count;
      } else {
        breakdown.Other.amount += amt;
        breakdown.Other.count += item.count;
      }
    });

    return {
      breakdown,
      totalReconciled: Math.round(totalReconciled)
    };
  },

  /**
   * Time series chart data generator with custom periods
   * period: '7d', '30d', '3m', '6m', '1y'
   */
  getSalesChartData: async (period = '30d') => {
    const now = new Date();
    let daysCount = 30;
    let groupByFormat = '%Y-%m-%d';

    if (period === '7d') daysCount = 7;
    else if (period === '30d') daysCount = 30;
    else if (period === '3m') daysCount = 90;
    else if (period === '6m') daysCount = 180;
    else if (period === '1y') daysCount = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (daysCount - 1));
    startDate.setHours(0, 0, 0, 0);

    const rawSeries = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: COMPLETED_STATUSES }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          cost: { $sum: '$totalCost' },
          orders: { $sum: 1 },
          onlineRevenue: {
            $sum: {
              $cond: [{ $in: ['$orderChannel', ['online', 'web']] }, '$totalPrice', 0]
            }
          },
          whatsAppRevenue: {
            $sum: {
              $cond: [{ $eq: ['$orderChannel', 'whatsapp'] }, '$totalPrice', 0]
            }
          },
          offlineRevenue: {
            $sum: {
              $cond: [{ $eq: ['$orderChannel', 'offline'] }, '$totalPrice', 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const seriesMap = new Map(rawSeries.map((s) => [s._id, s]));
    const resultPoints = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label =
        daysCount <= 7
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const found = seriesMap.get(key);
      const rev = found ? Math.round(found.revenue) : 0;
      const cogs = found ? Math.round(found.cost) : 0;
      const profit = Math.max(0, rev - cogs);

      resultPoints.push({
        date: key,
        label,
        revenue: rev,
        cost: cogs,
        grossProfit: profit,
        orders: found ? found.orders : 0,
        onlineRevenue: found ? Math.round(found.onlineRevenue) : 0,
        whatsAppRevenue: found ? Math.round(found.whatsAppRevenue) : 0,
        offlineRevenue: found ? Math.round(found.offlineRevenue) : 0
      });
    }

    return resultPoints;
  },

  /**
   * Business Growth Analytics
   * Month-over-Month (MoM) & Week-over-Week (WoW) growth rates
   */
  getGrowthAnalytics: async () => {
    const now = new Date();

    // Current Month Bounds
    const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const curMonthEnd = now;

    // Previous Month Bounds
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [curMonth, prevMonth] = await Promise.all([
      salesAnalyticsService.getProfitMetrics(curMonthStart, curMonthEnd),
      salesAnalyticsService.getProfitMetrics(prevMonthStart, prevMonthEnd)
    ]);

    // Customer counts
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const newCustomersThisMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: curMonthStart, $lte: curMonthEnd }
    });
    const newCustomersPrevMonth = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd }
    });

    const salesGrowth = calculateGrowthPercentage(curMonth.revenue, prevMonth.revenue);
    const profitGrowth = calculateGrowthPercentage(curMonth.grossProfit, prevMonth.grossProfit);
    const ordersGrowth = calculateGrowthPercentage(curMonth.totalOrders, prevMonth.totalOrders);
    const aovGrowth = calculateGrowthPercentage(curMonth.aov, prevMonth.aov);
    const customerGrowth = calculateGrowthPercentage(newCustomersThisMonth, newCustomersPrevMonth);

    return {
      currentPeriod: {
        monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        revenue: curMonth.revenue,
        grossProfit: curMonth.grossProfit,
        orders: curMonth.totalOrders,
        aov: curMonth.aov,
        newCustomers: newCustomersThisMonth
      },
      previousPeriod: {
        monthName: prevMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        revenue: prevMonth.revenue,
        grossProfit: prevMonth.grossProfit,
        orders: prevMonth.totalOrders,
        aov: prevMonth.aov,
        newCustomers: newCustomersPrevMonth
      },
      growth: {
        salesGrowth,
        profitGrowth,
        ordersGrowth,
        customerGrowth,
        aovGrowth
      },
      totalCustomers
    };
  },

  /**
   * Customer Analytics: Retention, Top spenders, Repeat purchase rate
   */
  getCustomerAnalytics: async () => {
    const totalRegistered = await User.countDocuments({ role: 'user' });

    // Find users who have completed orders
    const userOrderStats = await Order.aggregate([
      {
        $match: {
          user: { $ne: null },
          status: { $in: COMPLETED_STATUSES }
        }
      },
      {
        $group: {
          _id: '$user',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    const totalCustomersWithOrders = userOrderStats.length;
    const returningCustomers = userOrderStats.filter((u) => u.orderCount > 1).length;
    const repeatRate =
      totalCustomersWithOrders > 0
        ? Math.round((returningCustomers / totalCustomersWithOrders) * 1000) / 10
        : 0;

    // Populate top 10 customers
    const topCustomerIds = userOrderStats.slice(0, 10).map((u) => u._id);
    const usersInfo = await User.find({ _id: { $in: topCustomerIds } }).select('name email phone');
    const userMap = new Map(usersInfo.map((u) => [u._id.toString(), u]));

    const topCustomers = userOrderStats.slice(0, 10).map((u) => {
      const info = userMap.get(u._id.toString());
      return {
        id: u._id,
        name: info?.name || 'Customer',
        email: info?.email || '',
        phone: info?.phone || '',
        orderCount: u.orderCount,
        totalSpent: Math.round(u.totalSpent),
        lastOrderDate: u.lastOrderDate
      };
    });

    return {
      totalRegistered,
      totalCustomersWithOrders,
      returningCustomers,
      repeatPurchaseRate: repeatRate,
      topCustomers
    };
  },

  /**
   * Best Selling Products: Rankable by Units Sold, Revenue, or Gross Profit
   */
  getBestSellingProducts: async (sortBy = 'units', limit = 10) => {
    const rawItems = await Order.aggregate([
      { $match: { status: { $in: COMPLETED_STATUSES } } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          name: { $first: '$orderItems.name' },
          image: { $first: '$orderItems.image' },
          category: { $first: '$orderItems.category' },
          unitsSold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          totalCost: { $sum: { $multiply: ['$orderItems.costPrice', '$orderItems.qty'] } }
        }
      }
    ]);

    const productsFormatted = rawItems.map((item) => {
      const rev = Math.round(item.revenue || 0);
      const cost = Math.round(item.totalCost || 0);
      const grossProfit = Math.max(0, rev - cost);
      const margin = rev > 0 ? Math.round((grossProfit / rev) * 1000) / 10 : 0;

      return {
        id: item._id,
        name: item.name,
        image: item.image,
        category: item.category || 'grocery',
        unitsSold: item.unitsSold,
        revenue: rev,
        cost,
        grossProfit,
        profitMargin: margin
      };
    });

    if (sortBy === 'revenue') {
      productsFormatted.sort((a, b) => b.revenue - a.revenue);
    } else if (sortBy === 'profit') {
      productsFormatted.sort((a, b) => b.grossProfit - a.grossProfit);
    } else {
      productsFormatted.sort((a, b) => b.unitsSold - a.unitsSold);
    }

    return productsFormatted.slice(0, limit);
  },

  /**
   * Category Analytics: Revenue, COGS, Profit, and Units by Category
   */
  getCategoryAnalytics: async () => {
    const rawCategories = await Order.aggregate([
      { $match: { status: { $in: COMPLETED_STATUSES } } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: { $toLower: { $ifNull: ['$orderItems.category', 'grocery'] } },
          revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
          totalCost: { $sum: { $multiply: ['$orderItems.costPrice', '$orderItems.qty'] } },
          unitsSold: { $sum: '$orderItems.qty' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    return rawCategories.map((c) => {
      const rev = Math.round(c.revenue || 0);
      const cost = Math.round(c.totalCost || 0);
      const grossProfit = Math.max(0, rev - cost);
      const margin = rev > 0 ? Math.round((grossProfit / rev) * 1000) / 10 : 0;

      return {
        category: c._id || 'other',
        revenue: rev,
        cost,
        grossProfit,
        profitMargin: margin,
        unitsSold: c.unitsSold
      };
    });
  },

  /**
   * Business Health Checklist (Strictly grounded in database numbers)
   */
  getBusinessHealth: async () => {
    const [profitStats, growthStats, lowStockCount] = await Promise.all([
      salesAnalyticsService.getProfitMetrics(),
      salesAnalyticsService.getGrowthAnalytics(),
      Product.countDocuments({ $or: [{ stockCount: { $lte: 10 } }, { inStock: false }] })
    ]);

    return {
      salesStatus: growthStats.growth.salesGrowth >= 0 ? 'Growing' : 'Declining',
      profitStatus: growthStats.growth.profitGrowth >= 0 ? 'Growing' : 'Declining',
      orderStatus: growthStats.growth.ordersGrowth >= 0 ? 'Growing' : 'Declining',
      customerStatus: growthStats.growth.customerGrowth >= 0 ? 'Growing' : 'Declining',
      inventoryStatus: lowStockCount > 5 ? 'Attention Needed' : 'Healthy',
      lowStockAlerts: lowStockCount,
      grossMargin: profitStats.profitMargin,
      netMargin: profitStats.netMargin
    };
  },

  /**
   * AI Business Insights (Narrative summaries grounded 100% in database calculations)
   */
  getAIBusinessInsights: async () => {
    const [salesSummary, growth, bestSellers, categories, health] = await Promise.all([
      salesAnalyticsService.getSalesSummary(),
      salesAnalyticsService.getGrowthAnalytics(),
      salesAnalyticsService.getBestSellingProducts('units', 3),
      salesAnalyticsService.getCategoryAnalytics(),
      salesAnalyticsService.getBusinessHealth()
    ]);

    const insights = [];

    // Best Seller Insight
    if (bestSellers.length > 0) {
      const topProd = bestSellers[0];
      insights.push({
        type: 'product',
        title: 'Top Performing Item',
        text: `"${topProd.name}" is your highest velocity product with ${topProd.unitsSold} units sold generating ₹${topProd.revenue.toLocaleString()} in revenue.`,
        metric: `₹${topProd.grossProfit.toLocaleString()} profit`
      });
    }

    // Channel Performance Insight
    const channels = [
      { name: 'Offline Store Counter', val: salesSummary.thisMonth.offlineSales },
      { name: 'Online Storefront', val: salesSummary.thisMonth.onlineSales },
      { name: 'WhatsApp Direct', val: salesSummary.thisMonth.whatsAppSales }
    ].sort((a, b) => b.val - a.val);

    if (channels[0].val > 0) {
      insights.push({
        type: 'channel',
        title: 'Dominant Sales Channel',
        text: `${channels[0].name} generated the highest share of sales this month at ₹${channels[0].val.toLocaleString()}.`,
        metric: `${Math.round((channels[0].val / (salesSummary.thisMonth.totalRevenue || 1)) * 100)}% of total`
      });
    }

    // Growth Insight
    const sGrowth = growth.growth.salesGrowth;
    insights.push({
      type: 'growth',
      title: 'Monthly Revenue Velocity',
      text:
        sGrowth >= 0
          ? `Store revenue grew by +${sGrowth}% compared to last month.`
          : `Store revenue decreased by ${sGrowth}% compared to last month. Review promotions and fast-moving inventory.`,
      metric: `${sGrowth >= 0 ? '+' : ''}${sGrowth}% MoM`
    });

    // Category Insight
    if (categories.length > 0) {
      const topCat = categories[0];
      insights.push({
        type: 'category',
        title: 'Top Category Contribution',
        text: `The "${topCat.category.toUpperCase()}" category contributed ₹${topCat.revenue.toLocaleString()} with a healthy ${topCat.profitMargin}% gross margin.`,
        metric: `₹${topCat.grossProfit.toLocaleString()} gross profit`
      });
    }

    // Inventory Warning Insight
    if (health.lowStockAlerts > 0) {
      insights.push({
        type: 'inventory',
        title: 'Inventory Alert',
        text: `${health.lowStockAlerts} items have fallen below safety stock thresholds and need timely replenishment.`,
        metric: `${health.lowStockAlerts} items low`
      });
    }

    return {
      insights,
      health
    };
  }
};

export default salesAnalyticsService;
