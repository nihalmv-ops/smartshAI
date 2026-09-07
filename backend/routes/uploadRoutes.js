import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
    cb(null, `product-${cleanName}-${Date.now()}${ext}`);
  }
});

// File filter (accept images only)
const checkFileType = (file, cb) => {
  const filetypes = /jpg|jpeg|png|webp|gif|svg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only! Allowed formats: jpg, jpeg, png, webp, gif, svg'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

// @desc    Upload product image
// @route   POST /api/upload
// @access  Private / Admin
router.post('/', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  // Construct accessible URL
  const protocol = req.protocol;
  const host = req.get('host');
  const normalizedPath = req.file.path.replace(/\\/g, '/');
  const imageUrl = `${protocol}://${host}/${normalizedPath}`;

  res.json({
    success: true,
    message: 'Image uploaded successfully',
    imageUrl,
    filePath: `/${normalizedPath}`
  });
});

export default router;

