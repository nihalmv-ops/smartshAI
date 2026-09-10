import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'Skyline Mart',
      trim: true
    },
    deliveryFee: {
      type: Number,
      default: 25,
      min: 0
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 199,
      min: 0
    },
    deliveryEstimatedMinutes: {
      type: Number,
      default: 15,
      min: 1
    },
    topBannerText: {
      type: String,
      default: 'Get 20% OFF on your first grocery order with code FRESH20',
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Helper static to get or initialize default settings singleton
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      storeName: 'Skyline Mart',
      deliveryFee: 25,
      freeDeliveryThreshold: 199,
      deliveryEstimatedMinutes: 15,
      topBannerText: 'Get 20% OFF on your first grocery order with code FRESH20'
    });
  }
  return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
