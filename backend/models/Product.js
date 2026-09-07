import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please add a product category'],
      lowercase: true,
      trim: true
    },
    unit: {
      type: String,
      required: [true, 'Please add product unit/weight'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please add a product price'],
      default: 0
    },
    originalPrice: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    inStock: {
      type: Boolean,
      default: true
    },
    stockCount: {
      type: Number,
      default: 50
    },
    badge: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      required: [true, 'Please provide an image URL']
    },
    description: {
      type: String,
      default: ''
    },
    nutrition: {
      calories: { type: String, default: '-' },
      protein: { type: String, default: '-' },
      carbs: { type: String, default: '-' },
      fat: { type: String, default: '-' }
    },
    featured: {
      type: Boolean,
      default: false
    },
    popular: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Search indexing for fast name and category text search
productSchema.index({ name: 'text', category: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;

