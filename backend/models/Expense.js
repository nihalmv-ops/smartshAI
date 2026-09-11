import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Please select an expense category'],
      enum: [
        'Rent',
        'Electricity',
        'Staff Salary',
        'Transportation',
        'Maintenance',
        'Packaging',
        'Marketing',
        'Inventory Purchase',
        'Other'
      ],
      default: 'Other'
    },
    amount: {
      type: Number,
      required: [true, 'Please enter an expense amount'],
      min: [0, 'Expense amount cannot be negative']
    },
    description: {
      type: String,
      required: [true, 'Please provide an expense description'],
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'],
      default: 'Cash'
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: ''
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ paymentMethod: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;

