import mongoose from 'mongoose';

const dailyRegisterSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true
    },
    openingCash: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Opening cash cannot be negative']
    },
    cashSales: {
      type: Number,
      default: 0,
      min: 0
    },
    cashExpenses: {
      type: Number,
      default: 0,
      min: 0
    },
    cashWithdrawals: {
      type: Number,
      default: 0,
      min: 0
    },
    expectedClosingCash: {
      type: Number,
      default: 0
    },
    actualClosingCash: {
      type: Number,
      default: 0
    },
    difference: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open'
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    closedAt: {
      type: Date
    },
    notes: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook: compute expected closing cash and difference
dailyRegisterSchema.pre('save', function (next) {
  this.expectedClosingCash = Math.max(
    0,
    (this.openingCash || 0) +
      (this.cashSales || 0) -
      (this.cashExpenses || 0) -
      (this.cashWithdrawals || 0)
  );

  if (this.status === 'Closed') {
    this.difference = (this.actualClosingCash || 0) - this.expectedClosingCash;
  }
  next();
});

const DailyRegister = mongoose.model('DailyRegister', dailyRegisterSchema);
export default DailyRegister;

