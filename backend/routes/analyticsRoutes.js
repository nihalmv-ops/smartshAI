import express from 'express';
import {
  getSalesOverview,
  getSalesChart,
  getGrowthOverview,
  getCustomerOverview,
  getTopProducts,
  getCategoryBreakdown,
  getBusinessHealthOverview,
  getAIBusinessInsightsOverview,
  getReportData
} from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/sales', protect, admin, getSalesOverview);
router.get('/chart', protect, admin, getSalesChart);
router.get('/growth', protect, admin, getGrowthOverview);
router.get('/customers', protect, admin, getCustomerOverview);
router.get('/top-products', protect, admin, getTopProducts);
router.get('/categories', protect, admin, getCategoryBreakdown);
router.get('/health', protect, admin, getBusinessHealthOverview);
router.get('/ai-insights', protect, admin, getAIBusinessInsightsOverview);
router.get('/reports', protect, admin, getReportData);

export default router;

