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
        image: { type: String, required: true },
        price: { type: Number, required: true },
        unit: { type: String },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product'
        }
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
      enum: ['web', 'whatsapp'],
      default: 'web'
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

const Order = mongoose.model('Order', orderSchema);
export default Order;
