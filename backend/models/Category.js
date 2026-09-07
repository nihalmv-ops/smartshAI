import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Please add category name'],
      trim: true
    },
    itemCount: {
      type: String,
      default: '100+ items'
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      required: [true, 'Please provide a category banner image']
    },
    bgGradient: {
      type: String,
      default: 'from-blue-50 to-sky-50/60'
    },
    borderColor: {
      type: String,
      default: 'border-blue-100'
    },
    icon: {
      type: String,
      default: 'Package'
    }
  },
  {
    timestamps: true
  }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;

