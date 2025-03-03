import express from 'express';
import { authenticate, authorize } from '../app/middlewares/auth';


const router = express.Router();
router.get('/status', authenticate, (req, res) => {
  res.json({ status: 'Delivery routes working' });
});

export default router;