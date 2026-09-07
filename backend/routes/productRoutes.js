import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all products / POST new product (admin)
router.route('/')
  .get(getProducts)
  .post(protect, admin, createProduct);

// GET single product / PUT update product / DELETE product
router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

// Admin: Quick stock update
router.patch('/:id/stock', protect, admin, updateProductStock);

export default router;
