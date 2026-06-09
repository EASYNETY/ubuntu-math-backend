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
  const { itemType, itemId, amount, userId, itemName: requestItemName } = req.body;
  
  try {
    if (!userId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'User ID is required' });
    }

    // Validate item type
    if (!['course', 'book', 'subscription'].includes(itemType)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid item type' });
    }

    // Use provided itemName or default to itemId
    let itemName: string = requestItemName || itemId;

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

// Admin: Get All Payments
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 50, search } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { evripayReference: { $regex: search, $options: 'i' } },
        { paymentId: { $regex: search, $options: 'i' } },
        { itemName: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Payment.countDocuments(query);
    
    // Get counts by status
    const statusCounts = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return res.status(200).json({
      payments: payments.map(p => ({
        _id: p._id,
        paymentId: p.paymentId,
        userId: p.userId,
        itemType: p.itemType,
        itemId: p.itemId,
        itemName: p.itemName,
        amount: p.amount,
        amountFormatted: formatZAR(p.amount),
        currency: p.currency,
        status: p.status,
        reference: p.evripayReference,
        enrollmentGranted: p.enrollmentGranted,
        manualReview: p.manualReview,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
        expiresAt: p.expiresAt
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      },
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error retrieving payments' });
  }
};

// Admin: Approve Payment
export const approvePayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { adminUserId } = req.body;

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'INVALID_STATE', message: 'Payment is not pending' });
    }

    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Trigger enrollment
    await processEnrollment(payment);

    return res.status(200).json({
      paymentId: payment.paymentId,
      status: payment.status,
      message: 'Payment approved and access granted'
    });

  } catch (error) {
    console.error('Approve payment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error approving payment' });
  }
};

// Admin: Reject Payment
export const rejectPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params;
    const { reason, adminUserId } = req.body;

    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'INVALID_STATE', message: 'Payment is not pending' });
    }

    payment.status = 'failed';
    payment.failureReason = reason || 'Payment rejected by admin';
    await payment.save();

    return res.status(200).json({
      paymentId: payment.paymentId,
      status: payment.status,
      message: 'Payment rejected'
    });

  } catch (error) {
    console.error('Reject payment error:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error rejecting payment' });
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
    console.log('Processing enrollment for payment:', { 
      paymentId: payment.paymentId, 
      itemType: payment.itemType, 
      itemId: payment.itemId,
      userId: payment.userId 
    });

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
      // Handle both individual books and bundle
      if (payment.itemId === 'bundle-15-books') {
        // Bundle purchase - grant access to all books
        console.log('Processing bundle purchase for user:', payment.userId);
        
        // Get all books from the Book collection
        const allBooks = await Book.find({});
        const bookIds = allBooks.map(b => b._id.toString());
        
        console.log(`Found ${bookIds.length} books to add to bundle`);
        
        // Add all books to user's purchased books
        await User.findByIdAndUpdate(payment.userId, {
          $addToSet: { purchasedBooks: { $each: bookIds } }
        });

        // Also create a marketplace purchase record for the bundle
        const PlatformContent = (await import('../models/PlatformContent')).default;
        await PlatformContent.create({
          userId: payment.userId,
          contentType: 'bookpurchase',
          productType: 'bundle-15-books',
          title: 'Complete 15-Book Bundle',
          status: 'completed',
          amountPaid: payment.amount,
          currency: payment.currency,
          paymentGateway: 'evripay',
          licenseId: payment.evripayReference,
          expiresAt: null // Lifetime access
        });

        console.log('Bundle purchase completed for:', payment.userId);
        
      } else if (payment.itemId === 'cams-industrial-cookbook' || payment.itemId === 'cams-master-index') {
        // Cookbook or Master Index purchase - these are marketplace products
        console.log('Processing cookbook/index purchase:', payment.itemId);
        
        const PlatformContent = (await import('../models/PlatformContent')).default;
        await PlatformContent.create({
          userId: payment.userId,
          contentType: 'product_purchase',
          productType: payment.itemId,
          title: payment.itemName,
          status: 'completed',
          amountPaid: payment.amount,
          currency: payment.currency,
          paymentGateway: 'evripay',
          licenseId: payment.evripayReference,
          expiresAt: null // Lifetime access
        });

        console.log('Cookbook/index purchase completed:', payment.itemId);
        
      } else if (payment.itemId === 'patent-dossier') {
        // Patent Dossier purchase
        console.log('Processing patent dossier purchase');
        
        const PlatformContent = (await import('../models/PlatformContent')).default;
        await PlatformContent.create({
          userId: payment.userId,
          contentType: 'product_purchase',
          productType: 'patent-dossier',
          title: 'CAMS Industrial Patent Dossier',
          status: 'completed',
          amountPaid: payment.amount,
          currency: payment.currency,
          paymentGateway: 'evripay',
          licenseId: payment.evripayReference,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year access
        });

        console.log('Patent dossier purchase completed');
        
      } else {
        // Individual book purchase
        console.log('Processing individual book purchase:', payment.itemId);
        
        // Add book to user's purchased books array
        await User.findByIdAndUpdate(payment.userId, {
          $addToSet: { purchasedBooks: payment.itemId }
        });

        console.log('Individual book access granted:', payment.itemId);
      }

      payment.enrollmentGranted = true;
      payment.enrolledAt = new Date();
      await payment.save();

      console.log('Book/product access granted:', payment.paymentId);
    }
  } catch (error) {
    console.error('Enrollment error:', error);
    console.error('Error stack:', error.stack);
    payment.manualReview = true;
    await payment.save();
  }
}
