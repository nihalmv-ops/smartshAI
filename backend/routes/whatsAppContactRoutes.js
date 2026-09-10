import express from 'express';
import {
  getWhatsAppContacts,
  createWhatsAppContact,
  updateWhatsAppContact,
  deleteWhatsAppContact
} from '../controllers/whatsAppContactController.js';
import { protect, admin, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(optionalProtect, getWhatsAppContacts)
  .post(protect, admin, createWhatsAppContact);

router.route('/:id')
  .put(protect, admin, updateWhatsAppContact)
  .delete(protect, admin, deleteWhatsAppContact);

export default router;

