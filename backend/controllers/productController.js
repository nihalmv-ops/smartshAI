import Product from '../models/Product.js';

// @desc    Get all products with filtering, search and sorting
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { 
      search, 
      category, 
      minPrice, 
      maxPrice, 
      rating, 
      inStock, 
      sortBy,
      page = 1, 
      limit = 50 
    } = req.query;

    const query = {};

    // Keyword / Search query
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category.toLowerCase() !== 'all') {
      query.category = category.toLowerCase();
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating && Number(rating) > 0) {
      query.rating = { $gte: Number(rating) };
    }

    // Stock availability filter
    if (inStock === 'true') {
      query.inStock = true;
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (sortBy === 'price-low') sort = { price: 1 };
    else if (sortBy === 'price-high') sort = { price: -1 };
    else if (sortBy === 'rating') sort = { rating: -1 };
    else if (sortBy === 'name') sort = { name: 1 };
    else if (sortBy === 'popular') sort = { popular: -1, reviewsCount: -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found with id: ${req.params.id}`);
    }
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private / Admin
export const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      category,
      unit,
      price,
      originalPrice,
      rating,
      reviewsCount,
      inStock,
      stockCount,
      badge,
      image,
      description,
      nutrition,
      featured,
      popular
    } = req.body;

    const product = await Product.create({
      name,
      category,
      unit,
      price,
      originalPrice: originalPrice || price,
      rating: rating || 4.5,
      reviewsCount: reviewsCount || 0,
      inStock: inStock !== undefined ? inStock : true,
      stockCount: stockCount || 50,
      badge: badge || '',
      image,
      description: description || '',
      nutrition: nutrition || { calories: '-', protein: '-', carbs: '-', fat: '-' },
      featured: featured || false,
      popular: popular || false
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private / Admin
export const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found with id: ${req.params.id}`);
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private / Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found with id: ${req.params.id}`);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick update product stock count and availability
// @route   PATCH /api/products/:id/stock
// @access  Private / Admin
export const updateProductStock = async (req, res, next) => {
  try {
    const { stockCount, inStock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error(`Product not found with id: ${req.params.id}`);
    }

    if (stockCount !== undefined) {
      product.stockCount = Math.max(0, Number(stockCount));
      // Auto-set inStock flag based on stockCount if inStock was not explicitly provided
      if (inStock === undefined) {
        product.inStock = product.stockCount > 0;
      }
    }

    if (inStock !== undefined) {
      product.inStock = Boolean(inStock);
    }

    const updatedProduct = await product.save();

    res.json({
      success: true,
      message: 'Product stock updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};
