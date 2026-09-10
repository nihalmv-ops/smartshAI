import mongoose from 'mongoose';

const whatsAppContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'WhatsApp phone number is required'],
      trim: true
    },
    purpose: {
      type: String,
      default: 'Order Processing',
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Helper to sanitize phone numbers into international digits-only format
whatsAppContactSchema.statics.sanitizePhoneNumber = function (phone) {
  if (!phone) return '';
  let cleaned = phone.toString().replace(/\D/g, '');
  // If 10-digit Indian mobile number without country code, prefix with 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

// Auto-seeding static method ensuring at least 3 default contacts exist
whatsAppContactSchema.statics.seedDefaultContacts = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    const defaultContacts = [
      {
        name: 'Main Shop',
        phoneNumber: '919876543210',
        purpose: 'Main Orders & Express Dispatch',
        isActive: true,
        isDefault: true,
        displayOrder: 1
      },
      {
        name: 'Store Manager',
        phoneNumber: '919876543211',
        purpose: 'Store Management & Order Inquiries',
        isActive: true,
        isDefault: false,
        displayOrder: 2
      },
      {
        name: 'Order Manager',
        phoneNumber: '919876543212',
        purpose: 'Customer Support & Order Processing',
        isActive: true,
        isDefault: false,
        displayOrder: 3
      }
    ];

    await this.insertMany(defaultContacts);
    console.log('✅ Default WhatsApp contacts initialized (Main Shop, Store Manager, Order Manager)');
  }
};

const WhatsAppContact = mongoose.model('WhatsAppContact', whatsAppContactSchema);
export default WhatsAppContact;

