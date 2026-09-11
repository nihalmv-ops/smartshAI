import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'User'
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true, default: 1 },
        image: { type: String, default: '' },
        originalPrice: { type: Number, default: 0 },
        sellingPrice: { type: Number, required: true },
        price: { type: Number, required: true },
        costPrice: { type: Number, default: 0 },
        itemTotal: { type: Number, default: 0 },
        isPriceOverridden: { type: Boolean, default: false },
        category: { type: String, default: 'grocery' },
        unit: { type: String },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product'
        }
      }
    ],
    priceOverrideAudit: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, default: '' },
        originalPrice: { type: Number, default: 0 },
        chargedPrice: { type: Number, default: 0 },
        differencePerUnit: { type: Number, default: 0 },
        qty: { type: Number, default: 1 },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedByName: { type: String, default: 'Admin' },
        date: { type: Date, default: Date.now },
        receiptNumber: { type: String, default: '' }
      }
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, default: 'Bengaluru' },
      postalCode: { type: String, default: '560038' },
      phone: { type: String, required: true }
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: ''
    },
    orderChannel: {
      type: String,
      enum: ['online', 'web', 'whatsapp', 'offline'],
      default: 'online'
    },
    receiptNumber: {
      type: String,
      default: '',
      trim: true,
      index: true
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    whatsappContact: {
      name: { type: String, default: '' },
      phoneNumber: { type: String, default: '' }
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Cash on Delivery'
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    discount: {
      type: Number,
      required: true,
      default: 0.0
    },
    tax: {
      type: Number,
      default: 0.0
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 0.0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0
    },
    totalCost: {
      type: Number,
      default: 0.0
    },
    grossProfit: {
      type: Number,
      default: 0.0
    },
    status: {
      type: String,
      enum: [
        'WhatsApp Pending',
        'Pending',
        'Confirmed',
        'Processing',
        'Preparing',
        'Ready',
        'Out for Delivery',
        'Delivered',
        'Completed',
        'Cancelled'
      ],
      default: 'Pending'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: {
      type: Date
    },
    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for sales, reports, and financial aggregation
orderSchema.index({ orderChannel: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
