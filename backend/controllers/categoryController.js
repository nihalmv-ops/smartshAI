import Category from '../models/Category.js';
import defaultCategories from '../data/categories.js';

// Helper to format category for API responses
const formatCategory = (cat) => ({
  _id: cat._id,
  id: cat.slug,
  slug: cat.slug,
  name: cat.name,
  itemCount: cat.itemCount || '0 items',
  description: cat.description || '',
  image: cat.image,
  bgGradient: cat.bgGradient || 'from-blue-50 to-sky-50/60',
  borderColor: cat.borderColor || 'border-blue-100',
  icon: cat.icon || 'Package',
  createdAt: cat.createdAt,
  updatedAt: cat.updatedAt
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    let categories = await Category.find({}).sort({ createdAt: 1 });

    // Auto-seed default categories if database collection is empty
    if (categories.length === 0 && defaultCategories && defaultCategories.length > 0) {
      await Category.insertMany(defaultCategories);
      categories = await Category.find({}).sort({ createdAt: 1 });
    }

    res.json({
      success: true,
      count: categories.length,
      categories: categories.map(formatCategory)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID or slug
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    let category;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(identifier);
    } else {
      category = await Category.findOne({ slug: identifier.toLowerCase() });
    }

    if (!category) {
      res.status(404);
      throw new Error(`Category not found: ${identifier}`);
    }

    res.json({
      success: true,
      category: formatCategory(category)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private / Admin
export const createCategory = async (req, res, next) => {
  try {
    const { slug, name, itemCount, description, image, bgGradient, borderColor, icon } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error('Category name is required');
    }

    if (!image || !image.trim()) {
      res.status(400);
      throw new Error('Category banner image is required');
    }

    let normalizedSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!normalizedSlug) {
      normalizedSlug = `category-${Date.now()}`;
    }

    const existing = await Category.findOne({ slug: normalizedSlug });
    if (existing) {
      res.status(400);
      throw new Error(`Category with slug '${normalizedSlug}' already exists. Please choose another name or slug.`);
    }

    const category = await Category.create({
      slug: normalizedSlug,
      name: name.trim(),
      itemCount: itemCount?.trim() || '0 items',
      description: description?.trim() || '',
      image: image.trim(),
      bgGradient: bgGradient || 'from-emerald-50 to-teal-50/60',
      borderColor: borderColor || 'border-emerald-100',
      icon: icon || 'Package'
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: formatCategory(category)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category (including editing category image)
// @route   PUT /api/categories/:id
// @access  Private / Admin
export const updateCategory = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    let category = await Category.findOne({
      $or: [
        ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
        { slug: identifier.toLowerCase() }
      ]
    });

    if (!category) {
      res.status(404);
      throw new Error(`Category not found: ${identifier}`);
    }

    const updateData = { ...req.body };

    // If new slug is provided and changed, verify uniqueness
    if (updateData.slug) {
      updateData.slug = updateData.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      if (updateData.slug !== category.slug) {
        const existing = await Category.findOne({ slug: updateData.slug });
        if (existing) {
          res.status(400);
          throw new Error(`Category with slug '${updateData.slug}' already exists`);
        }
      }
    }

    category = await Category.findByIdAndUpdate(category._id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: formatCategory(category)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private / Admin
export const deleteCategory = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    let category = await Category.findOne({
      $or: [
        ...(identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : []),
        { slug: identifier.toLowerCase() }
      ]
    });

    if (!category) {
      res.status(404);
      throw new Error(`Category not found: ${identifier}`);
    }

    await Category.findByIdAndDelete(category._id);

    res.json({
      success: true,
      message: `Category '${category.name}' deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};
