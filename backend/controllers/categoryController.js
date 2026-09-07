import Category from '../models/Category.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.json({
      success: true,
      count: categories.length,
      categories
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

    res.json({ success: true, category });
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

    const normalizedSlug = (slug || name).toLowerCase().replace(/\s+/g, '-');
    const existing = await Category.findOne({ slug: normalizedSlug });
    if (existing) {
      res.status(400);
      throw new Error(`Category with slug '${normalizedSlug}' already exists`);
    }

    const category = await Category.create({
      slug: normalizedSlug,
      name,
      itemCount: itemCount || '100+ items',
      description: description || '',
      image,
      bgGradient: bgGradient || 'from-blue-50 to-sky-50/60',
      borderColor: borderColor || 'border-blue-100',
      icon: icon || 'Package'
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a category
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

    category = await Category.findByIdAndUpdate(category._id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
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
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
