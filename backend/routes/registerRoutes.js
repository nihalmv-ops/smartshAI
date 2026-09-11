import express from 'express';
import {
  getTodayRegister,
  openRegister,
  recordCashWithdrawal,
  closeRegister,
  getRegisterHistory
} from '../controllers/registerController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/today', protect, getTodayRegister);
router.post('/open', protect, openRegister);
router.post('/withdrawal', protect, recordCashWithdrawal);
router.post('/close', protect, closeRegister);
router.get('/history', protect, admin, getRegisterHistory);

export default router;

