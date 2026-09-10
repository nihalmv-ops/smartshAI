import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus
} from '../controllers/orderController.js';
import { protect, admin, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create order (supports guest WhatsApp orders and authenticated users) / Admin get all orders
router.route('/')
  .post(optionalProtect, createOrder)
  .get(protect, admin, getAllOrders);

// User's own orders
router.get('/myorders', protect, getMyOrders);

// Single order details
router.get('/:id', optionalProtect, getOrderById);

// Admin update order delivery status
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
