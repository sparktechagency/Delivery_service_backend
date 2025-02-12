import express from 'express';
import { authenticate, authorize } from '../app/middlewares/auth';
// import { UserRole } from '../types/index.js';

const router = express.Router();

// TODO: Add delivery controllers and routes
// Placeholder to fix the import error
router.get('/status', authenticate, (req, res) => {
  res.json({ status: 'Delivery routes working' });
});

export default router;