import express from 'express';
import {
  getExpenses,
  createExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getExpenses)
  .post(protect, admin, createExpense);

router.route('/:id')
  .delete(protect, admin, deleteExpense);

export default router;

