import salesAnalyticsService from '../services/salesAnalyticsService.js';
import Order from '../models/Order.js';
import Expense from '../models/Expense.js';
import Product from '../models/Product.js';

// @desc    Get complete executive sales & profit overview
// @route   GET /api/analytics/sales
// @access  Private / Admin
export const getSalesOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const [salesSummary, profitMetrics, paymentBreakdown, chartData] = await Promise.all([
      salesAnalyticsService.getSalesSummary(),
      salesAnalyticsService.getProfitMetrics(startDate, endDate),
      salesAnalyticsService.getPaymentAnalytics(startDate, endDate),
      salesAnalyticsService.getSalesChartData(req.query.period || '30d')
    ]);

    res.json({
      success: true,
      salesSummary,
      profitMetrics,
      paymentBreakdown,
      chartData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chart time series data with period filter
// @route   GET /api/analytics/chart
// @access  Private / Admin
export const getSalesChart = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const chart = await salesAnalyticsService.getSalesChartData(period);
    res.json({ success: true, period, chart });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Business Growth % (Sales, Profit, Orders, Customers, AOV)
// @route   GET /api/analytics/growth
// @access  Private / Admin
export const getGrowthOverview = async (req, res, next) => {
  try {
    const growth = await salesAnalyticsService.getGrowthAnalytics();
    res.json({ success: true, data: growth });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer analytics & retention metrics
// @route   GET /api/analytics/customers
// @access  Private / Admin
export const getCustomerOverview = async (req, res, next) => {
  try {
    const customers = await salesAnalyticsService.getCustomerAnalytics();
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top selling products rankable by units, revenue, or profit
// @route   GET /api/analytics/top-products
// @access  Private / Admin
export const getTopProducts = async (req, res, next) => {
  try {
    const { sortBy = 'units', limit = 10 } = req.query;
    const products = await salesAnalyticsService.getBestSellingProducts(sortBy, Number(limit));
    res.json({ success: true, sortBy, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category sales and profit analytics
// @route   GET /api/analytics/categories
// @access  Private / Admin
export const getCategoryBreakdown = async (req, res, next) => {
  try {
    const categories = await salesAnalyticsService.getCategoryAnalytics();
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business health indicators and low-stock warnings
// @route   GET /api/analytics/health
// @access  Private / Admin
export const getBusinessHealthOverview = async (req, res, next) => {
  try {
    const health = await salesAnalyticsService.getBusinessHealth();
    res.json({ success: true, health });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI business insights narrative grounded in calculated data
// @route   GET /api/analytics/ai-insights
// @access  Private / Admin
export const getAIBusinessInsightsOverview = async (req, res, next) => {
  try {
    const insights = await salesAnalyticsService.getAIBusinessInsights();
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate tabular data for downloadable & printable reports
// @route   GET /api/analytics/reports
// @access  Private / Admin
export const getReportData = async (req, res, next) => {
  try {
    const { reportType = 'sales', startDate, endDate, channel = 'all' } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        dateFilter.createdAt.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = e;
      }
    }

    if (channel && channel !== 'all') {
      dateFilter.orderChannel = channel === 'online' ? { $in: ['online', 'web'] } : channel;
    }

    dateFilter.status = { $ne: 'Cancelled' };

    let reportRows = [];
    let reportSummary = {};

    switch (reportType) {
      case 'product': {
        reportRows = await salesAnalyticsService.getBestSellingProducts('revenue', 100);
        break;
      }
      case 'category': {
        reportRows = await salesAnalyticsService.getCategoryAnalytics();
        break;
      }
      case 'expense': {
        const expFilter = {};
        if (startDate || endDate) {
          expFilter.date = {};
          if (startDate) expFilter.date.$gte = new Date(startDate);
          if (endDate) expFilter.date.$lte = new Date(endDate);
        }
        reportRows = await Expense.find(expFilter).sort({ date: -1 });
        break;
      }
      case 'inventory': {
        reportRows = await Product.find({})
          .select('name category price costPrice stockCount inStock barcode')
          .sort({ stockCount: 1 });
        break;
      }
      case 'payment': {
        const payData = await salesAnalyticsService.getPaymentAnalytics(startDate, endDate);
        reportRows = Object.entries(payData.breakdown).map(([method, val]) => ({
          paymentMethod: method,
          amount: val.amount,
          transactionCount: val.count
        }));
        reportSummary = { totalAmount: payData.totalReconciled };
        break;
      }
      case 'profit': {
        reportSummary = await salesAnalyticsService.getProfitMetrics(startDate, endDate);
        reportRows = [
          { metric: 'Gross Revenue', value: reportSummary.revenue },
          { metric: 'Cost of Goods Sold (COGS)', value: reportSummary.cogs },
          { metric: 'Gross Profit', value: reportSummary.grossProfit },
          { metric: 'Gross Profit Margin', value: `${reportSummary.profitMargin}%` },
          { metric: 'Total Operating Expenses', value: reportSummary.totalExpenses },
          { metric: 'Net Profit', value: reportSummary.netProfit },
          { metric: 'Net Profit Margin', value: `${reportSummary.netMargin}%` },
          { metric: 'Total Completed Orders', value: reportSummary.totalOrders },
          { metric: 'Average Order Value (AOV)', value: reportSummary.aov }
        ];
        break;
      }
      case 'daily':
      case 'monthly':
      case 'channel':
      case 'sales':
      default: {
        const orders = await Order.find(dateFilter)
          .populate('user', 'name email phone')
          .sort({ createdAt: -1 })
          .limit(500);

        reportRows = orders.map((o) => ({
          orderId: o.receiptNumber || o._id,
          date: new Date(o.createdAt).toLocaleDateString(),
          time: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: o.orderChannel || 'online',
          customer: o.shippingAddress?.fullName || o.user?.name || 'Customer',
          itemsCount: o.orderItems?.length || 0,
          paymentMethod: o.paymentMethod,
          totalPrice: o.totalPrice,
          totalCost: o.totalCost || 0,
          grossProfit: o.grossProfit || Math.max(0, o.totalPrice - (o.totalCost || 0)),
          status: o.status
        }));
        break;
      }
    }

    res.json({
      success: true,
      reportType,
      filters: { startDate, endDate, channel },
      count: reportRows.length,
      summary: reportSummary,
      rows: reportRows
    });
  } catch (error) {
    next(error);
  }
};
