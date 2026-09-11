import express from 'express';
import {
  createOfflineSale,
  getPosProducts,
  getPosShiftSummary
} from '../controllers/posController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POS routes are protected for authorized admin/staff users
router.post('/sale', protect, createOfflineSale);
router.get('/products', protect, getPosProducts);
router.get('/shift-summary', protect, getPosShiftSummary);

export default router;

