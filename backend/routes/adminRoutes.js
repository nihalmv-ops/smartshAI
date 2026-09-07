import express from 'express';
import { getAdminDashboardStats } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected admin dashboard analytics
router.get('/dashboard', protect, admin, getAdminDashboardStats);

export default router;

