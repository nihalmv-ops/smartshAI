import express from 'express';
import { getCart, saveCart, clearCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCart)
  .post(protect, saveCart)
  .delete(protect, clearCart);

export default router;

