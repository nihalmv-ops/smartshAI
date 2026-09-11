import DailyRegister from '../models/DailyRegister.js';
import Order from '../models/Order.js';
import Expense from '../models/Expense.js';

// @desc    Get or initialize today's cash register with live cash sales & expenses
// @route   GET /api/register/today
// @access  Private (Staff / Admin)
export const getTodayRegister = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Live cash sales from offline POS orders today
    const cashSalesAgg = await Order.aggregate([
      {
        $match: {
          orderChannel: 'offline',
          paymentMethod: 'Cash',
          status: { $ne: 'Cancelled' },
          createdAt: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalCashSales: { $sum: '$totalPrice' },
          count: { $sum: 1 }
        }
      }
    ]);
    const liveCashSales = cashSalesAgg.length > 0 ? Math.round(cashSalesAgg[0].totalCashSales) : 0;
    const cashSalesCount = cashSalesAgg.length > 0 ? cashSalesAgg[0].count : 0;

    // 2. Live cash expenses recorded today
    const cashExpenseAgg = await Expense.aggregate([
      {
        $match: {
          paymentMethod: 'Cash',
          date: { $gte: todayStart, $lte: todayEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalCashExpenses: { $sum: '$amount' }
        }
      }
    ]);
    const liveCashExpenses =
      cashExpenseAgg.length > 0 ? Math.round(cashExpenseAgg[0].totalCashExpenses) : 0;

    // 3. Find or create today's register record
    let register = await DailyRegister.findOne({ date: todayStart })
      .populate('openedBy', 'name email')
      .populate('closedBy', 'name email');

    if (!register) {
      register = new DailyRegister({
        date: todayStart,
        openingCash: 0,
        cashSales: liveCashSales,
        cashExpenses: liveCashExpenses,
        cashWithdrawals: 0,
        status: 'Open',
        openedBy: req.user ? req.user._id : undefined
      });
      await register.save();
    } else if (register.status === 'Open') {
      // Sync latest live cash sales & expenses
      register.cashSales = liveCashSales;
      register.cashExpenses = liveCashExpenses;
      await register.save();
    }

    const expectedCash = Math.max(
      0,
      (register.openingCash || 0) +
        (register.cashSales || 0) -
        (register.cashExpenses || 0) -
        (register.cashWithdrawals || 0)
    );

    res.json({
      success: true,
      register,
      liveStats: {
        openingCash: register.openingCash,
        cashSales: register.cashSales,
        cashSalesCount,
        cashExpenses: register.cashExpenses,
        cashWithdrawals: register.cashWithdrawals,
        expectedClosingCash: expectedCash,
        actualClosingCash: register.actualClosingCash,
        difference: register.difference,
        status: register.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set shift opening cash
// @route   POST /api/register/open
// @access  Private (Staff / Admin)
export const openRegister = async (req, res, next) => {
  try {
    const { openingCash = 0 } = req.body;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let register = await DailyRegister.findOne({ date: todayStart });

    if (!register) {
      register = new DailyRegister({
        date: todayStart,
        openingCash: Math.max(0, Number(openingCash)),
        status: 'Open',
        openedBy: req.user._id
      });
    } else {
      register.openingCash = Math.max(0, Number(openingCash));
      register.status = 'Open';
      register.openedBy = req.user._id;
    }

    await register.save();

    res.json({
      success: true,
      message: `Shift opening cash set to ₹${register.openingCash}`,
      register
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record cash withdrawal from drawer
// @route   POST /api/register/withdrawal
// @access  Private (Staff / Admin)
export const recordCashWithdrawal = async (req, res, next) => {
  try {
    const { amount = 0, notes = '' } = req.body;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let register = await DailyRegister.findOne({ date: todayStart });
    if (!register) {
      res.status(404);
      throw new Error("Today's register not initialized");
    }

    register.cashWithdrawals = (register.cashWithdrawals || 0) + Math.max(0, Number(amount));
    if (notes) {
      register.notes = (register.notes ? register.notes + ' | ' : '') + `Withdrawal ₹${amount}: ${notes}`;
    }

    await register.save();

    res.json({
      success: true,
      message: `Cash withdrawal of ₹${amount} recorded`,
      register
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close daily cash register with actual count and variance calculation
// @route   POST /api/register/close
// @access  Private (Staff / Admin)
export const closeRegister = async (req, res, next) => {
  try {
    const { actualClosingCash, notes = '' } = req.body;

    if (actualClosingCash === undefined || actualClosingCash === null) {
      res.status(400);
      throw new Error('Please enter the physical actual closing cash amount');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let register = await DailyRegister.findOne({ date: todayStart });
    if (!register) {
      res.status(404);
      throw new Error("Today's register not found");
    }

    register.actualClosingCash = Number(actualClosingCash);
    register.status = 'Closed';
    register.closedBy = req.user._id;
    register.closedAt = new Date();
    if (notes) {
      register.notes = (register.notes ? register.notes + ' | ' : '') + notes.trim();
    }

    await register.save();

    res.json({
      success: true,
      message: 'Daily cash register closed successfully',
      register,
      reconciliation: {
        expectedClosingCash: register.expectedClosingCash,
        actualClosingCash: register.actualClosingCash,
        difference: register.difference,
        status: register.difference === 0 ? 'Balanced' : register.difference > 0 ? 'Cash Over' : 'Cash Short'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get historical register closings
// @route   GET /api/register/history
// @access  Private (Staff / Admin)
export const getRegisterHistory = async (req, res, next) => {
  try {
    const registers = await DailyRegister.find({})
      .populate('openedBy', 'name email')
      .populate('closedBy', 'name email')
      .sort({ date: -1 })
      .limit(30);

    res.json({
      success: true,
      count: registers.length,
      registers
    });
  } catch (error) {
    next(error);
  }
};

