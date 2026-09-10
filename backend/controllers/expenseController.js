import Expense from '../models/Expense.js';

// @desc    Get all expenses with date and category filtering
// @route   GET /api/expenses
// @access  Private / Admin
export const getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        filter.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        filter.date.$lte = e;
      }
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, expenses, categoryAgg] = await Promise.all([
      Expense.countDocuments(filter),
      Expense.find(filter)
        .populate('addedBy', 'name email')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Expense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ])
    ]);

    const totalExpenseAmount = categoryAgg.reduce((acc, c) => acc + (c.totalAmount || 0), 0);

    res.json({
      success: true,
      count: expenses.length,
      totalCount,
      page: pageNum,
      pages: Math.ceil(totalCount / limitNum),
      totalExpenseAmount: Math.round(totalExpenseAmount),
      categoryBreakdown: categoryAgg,
      expenses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new business expense
// @route   POST /api/expenses
// @access  Private / Admin
export const createExpense = async (req, res, next) => {
  try {
    const { category, amount, description, date, paymentMethod, referenceNumber } = req.body;

    if (!category) {
      res.status(400);
      throw new Error('Please select an expense category');
    }

    if (amount === undefined || Number(amount) < 0) {
      res.status(400);
      throw new Error('Please enter a valid expense amount');
    }

    if (!description || !description.trim()) {
      res.status(400);
      throw new Error('Please provide an expense description');
    }

    const expense = new Expense({
      category,
      amount: Number(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'Cash',
      referenceNumber: referenceNumber ? referenceNumber.trim() : '',
      addedBy: req.user ? req.user._id : undefined
    });

    const savedExpense = await expense.save();

    res.status(201).json({
      success: true,
      message: 'Business expense recorded successfully',
      expense: savedExpense
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private / Admin
export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      res.status(404);
      throw new Error('Expense record not found');
    }

    await expense.deleteOne();

    res.json({
      success: true,
      message: 'Expense record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
