import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Payment from '../models/Payment';
import Course from '../models/Course';
import { Book } from '../models/PlatformContent';
import Enrollment from '../models/Enrollment';
import User from '../models/User';
import { formatZAR } from '../utils/currency';
import crypto from 'crypto';

// Initiate Payment
export const initiatePayment = async (req: Request, res: Response) => {
  const { itemType, itemId, amount, userId } = req.body;
  
  try {
    if (!userId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'User ID is required' });
    }

    // Validate item type
    if (!['course', 'book', 'subscription'].includes(itemType)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid item type' });
    }

    // Fetch item and validate price
    let item: any;
    let itemName: string;
    let itemPrice: number;

    if (itemType === 'course') {
      item = await Course.findById(itemId);
      if (!item) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Course not found' });
      }
      itemName = item.title;
      itemPrice = item.price || 0;
    } else if (itemType === 'book') {
      item = await Book.findById(itemId);
      if (!item) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Book not found' });
      }
      itemName = item.title;
      itemPrice = item.price || 0;
    } else {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Subscription payments not yet implemented' });
    }

    // Validate amount matches item price
    if (Math.abs(amount - itemPrice) > 0.01) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Amount does not match item price' });
    }

    // Generate payment ID
    const paymentId = `PAY-${uuidv4()}`;
    const reference = `UBU-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment intent with EvriPay (SKIPPED - direct bank transfer flow)
    // For now, we're using a direct bank transfer flow without EvriPay API integration
    // The payment will be verified manually via webhook or bank confirmation
    
    // Create payment record
    const payment = await Payment.create({
      paymentId,
      userId,
      itemType,
      itemId,
      itemName,
      amount,
      currency: 'ZAR',
      status: 'pending',
      evripayReference: reference,
      evripayPaymentId: paymentId // Using our own payment ID for now
    });

    // Return payment details
    return res.status(201).json({
      paymentId: payment.paymentId,
      status: payment.status,
      bankDetails: {
        accountNumber: '63186361291',
        accountHolder: 'Centre for Applied Maritime Studies',
        bank: 'FNB',
        branch: 'MY BRANCH (255355)',
        swiftCode: 'FIRNZAJJ'
      },
      reference: payment.evripayReference,
      amount: formatZAR(payment.amount),
      currency: payment.currency,
      itemName: payment.itemName
    });

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', { itemType, itemId, amount, userId });
    return res.status(500).json({ 
      error: 'INTERNAL_ERROR', 
      message: 'Payment processing error, please contact support',
      supportEmail: 'info@maritimestudies.co.za'
    });
  }
};

// Get Payment Status
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { userId } = req.query;

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });
    }

    // Check ownership (only if userId is provided)
    if (userId && payment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    // If still pending, check with EvriPay (DISABLED - manual verification flow)
    // For now, payment status updates will come via webhook or manual admin action
    /*
    if (payment.status === 'pending' && payment.evripayPaymentId) {
      try {
        const evripayStatus = await evripayClient.getPaymentStatus(payment.evripayPaymentId);
        
        if (evripayStatus.status === 'completed' && payment.status === 'pending') {
          payment.status = 'completed';
          payment.completedAt = new Date();
          await payment.save();
          
          // Trigger enrollment
          await processEnrollment(payment);
        } else if (evripayStatus.status === 'failed') {
          payment.status = 'failed';
          await payment.save();
        }
      } catch (error) {
        console.error('Error checking EvriPay status:', error);
      }
    }
    */

    return res.status(200).json({
      paymentId: payment.paymentId,
      status: payment.status,
      amount: formatZAR(payment.amount),
      itemType: payment.itemType,
      itemName: payment.itemName,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error retrieving payment status' });
  }
};

// Get Payment History
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'User ID is required' });
    }

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Payment.countDocuments(query);

    return res.status(200).json({
      payments: payments.map(p => ({
        paymentId: p.paymentId,
        itemType: p.itemType,
        itemName: p.itemName,
        amount: formatZAR(p.amount),
        status: p.status,
        reference: p.evripayReference,
        createdAt: p.createdAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error retrieving payment history' });
  }
};

// Cancel Payment
export const cancelPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'User ID is required' });
    }

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });
    }

    if (payment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ error: 'INVALID_STATE', message: 'Cannot cancel completed payment' });
    }

    if (payment.status === 'pending') {
      payment.status = 'cancelled';
      await payment.save();
    }

    return res.status(200).json({
      paymentId: payment.paymentId,
      status: payment.status,
      message: 'Payment cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel payment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error cancelling payment' });
  }
};

// Webhook Handler
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-evripay-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid signature' });
    }

    const { eventType, paymentId: evripayPaymentId, status } = req.body;

    console.log('Webhook received:', { eventType, evripayPaymentId, status });

    // Find payment by EvriPay payment ID
    const payment = await Payment.findOne({ evripayPaymentId });

    if (!payment) {
      console.error('Payment not found for webhook:', evripayPaymentId);
      return res.status(200).json({ received: true });
    }

    // Check for duplicate (idempotency)
    if (payment.status === status) {
      console.log('Duplicate webhook - already processed');
      return res.status(200).json({ received: true });
    }

    // Update payment status
    if (status === 'completed' && payment.status === 'pending') {
      payment.status = 'completed';
      payment.completedAt = new Date();
      await payment.save();

      // Trigger enrollment
      await processEnrollment(payment);
    } else if (status === 'failed') {
      payment.status = 'failed';
      await payment.save();
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

// Helper: Verify Webhook Signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.EVRIPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Helper: Process Enrollment
async function processEnrollment(payment: any): Promise<void> {
  try {
    if (payment.itemType === 'course') {
      // Check if enrollment already exists
      const existingEnrollment = await Enrollment.findOne({
        userId: payment.userId,
        courseId: payment.itemId
      });

      if (!existingEnrollment) {
        await Enrollment.create({
          userId: payment.userId,
          courseId: payment.itemId,
          lessonProgress: [],
          overallProgress: 0
        });
      }

      payment.enrollmentGranted = true;
      payment.enrolledAt = new Date();
      await payment.save();

      console.log('Course enrollment completed:', payment.paymentId);
    } else if (payment.itemType === 'book') {
      // Add book to user's purchased books
      await User.findByIdAndUpdate(payment.userId, {
        $addToSet: { purchasedBooks: payment.itemId }
      });

      payment.enrollmentGranted = true;
      payment.enrolledAt = new Date();
      await payment.save();

      console.log('Book access granted:', payment.paymentId);
    }
  } catch (error) {
    console.error('Enrollment error:', error);
    payment.manualReview = true;
    await payment.save();
  }
}
