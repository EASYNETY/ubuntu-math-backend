import express from 'express';
import { 
  initiatePayment, 
  getPaymentStatus, 
  getPaymentHistory, 
  cancelPayment,
  handleWebhook
} from '../controllers/evripayPayment';

const router = express.Router();

// Payment routes (require authentication - add your auth middleware)
router.post('/initiate', initiatePayment);
router.get('/:paymentId/status', getPaymentStatus);
router.get('/history', getPaymentHistory);
router.post('/:paymentId/cancel', cancelPayment);

// Webhook route (no auth - uses signature verification)
router.post('/webhook', handleWebhook);

export default router;
