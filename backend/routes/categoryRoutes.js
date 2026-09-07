import express from 'express';
import {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET all categories / POST category (admin)
router.route('/')
  .get(getCategories)
  .post(protect, admin, createCategory);

// GET single category / PUT update / DELETE category
router.route('/:id')
  .get(getCategoryByIdOrSlug)
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

export default router;
