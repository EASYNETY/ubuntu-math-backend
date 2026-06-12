const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Manual Payment Approval Script
 * 
 * This script approves pending payments and triggers the enrollment/content delivery process.
 * Use this when you need to manually approve a payment after bank transfer verification.
 * 
 * Usage: node approve-payment-manual.js <paymentId or reference>
 */

async function approvePayment(searchTerm) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Load models
    const Payment = require('./dist/models/Payment').default;
    const User = require('./dist/models/User').default;
    const Enrollment = require('./dist/models/Enrollment').default;
    const { Book, BookPurchase } = require('./dist/models/PlatformContent');

    // Find the payment
    let payment = await Payment.findOne({ 
      $or: [
        { paymentId: searchTerm },
        { evripayReference: searchTerm }
      ]
    });

    if (!payment) {
      console.error('❌ Payment not found with ID or reference:', searchTerm);
      process.exit(1);
    }

    console.log('=== Payment Details ===');
    console.log(`Payment ID: ${payment.paymentId}`);
    console.log(`User ID: ${payment.userId}`);
    console.log(`Item Type: ${payment.itemType}`);
    console.log(`Item ID: ${payment.itemId}`);
    console.log(`Item Name: ${payment.itemName}`);
    console.log(`Amount: ${payment.currency} ${payment.amount}`);
    console.log(`Status: ${payment.status}`);
    console.log(`Reference: ${payment.evripayReference}`);
    console.log(`Created: ${payment.createdAt}`);
    console.log();

    if (payment.status !== 'pending') {
      console.log(`⚠️  Payment status is "${payment.status}" (not pending)`);
      if (payment.status === 'completed') {
        console.log(`✓ Payment already completed at ${payment.completedAt}`);
        console.log(`✓ Enrollment granted: ${payment.enrollmentGranted}`);
      }
      await mongoose.connection.close();
      return;
    }

    // Update payment status
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();
    console.log('✓ Payment status updated to: completed\n');

    // Process enrollment based on item type
    console.log('=== Processing Enrollment ===');

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
        console.log('✓ Course enrollment created');
      } else {
        console.log('ℹ️  Course enrollment already exists');
      }

      payment.enrollmentGranted = true;
      payment.enrolledAt = new Date();
      await payment.save();

    } else if (payment.itemType === 'book') {
      
      if (payment.itemId === 'bundle-15-books') {
        // Bundle purchase
        console.log('Processing bundle purchase...');
        
        const allBooks = await Book.find({});
        const bookIds = allBooks.map(b => b._id);
        
        console.log(`Found ${bookIds.length} books in database`);
        
        if (bookIds.length > 0) {
          await User.findByIdAndUpdate(payment.userId, {
            $addToSet: { purchasedBooks: { $each: bookIds } }
          });
          console.log(`✓ Added ${bookIds.length} books to user's purchasedBooks`);
        }

        // Create bundle purchase record
        await BookPurchase.create({
          userId: payment.userId,
          bundlePurchase: true,
          amountPaid: payment.amount,
          currency: payment.currency,
          paymentGateway: 'evripay',
          paymentReference: payment.evripayReference,
          status: 'completed',
        });
        console.log('✓ BookPurchase record created for bundle');

      } else if (mongoose.Types.ObjectId.isValid(payment.itemId)) {
        // Individual book purchase
        console.log('Processing individual book purchase...');
        
        await User.findByIdAndUpdate(payment.userId, {
          $addToSet: { purchasedBooks: payment.itemId }
        });
        console.log(`✓ Added book ${payment.itemId} to user's purchasedBooks`);

        await BookPurchase.create({
          userId: payment.userId,
          bookId: payment.itemId,
          bundlePurchase: false,
          amountPaid: payment.amount,
          currency: payment.currency,
          paymentGateway: 'evripay',
          paymentReference: payment.evripayReference,
          status: 'completed',
        });
        console.log('✓ BookPurchase record created');

      } else {
        console.log(`⚠️  Unrecognized book item ID: ${payment.itemId}`);
      }

      payment.enrollmentGranted = true;
      payment.enrolledAt = new Date();
      await payment.save();
    }

    console.log('\n✓ Enrollment granted: true');
    console.log(`✓ Enrolled at: ${payment.enrolledAt}`);
    console.log('\n✅ Payment approved successfully!');
    console.log('\nUser can now access their purchased content.');

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Get payment ID from command line
const searchTerm = process.argv[2];

if (!searchTerm) {
  console.error('Usage: node approve-payment-manual.js <paymentId or reference>');
  console.error('Example: node approve-payment-manual.js PAY-abc123');
  console.error('Example: node approve-payment-manual.js UBU-1234567890-ABC123');
  process.exit(1);
}

approvePayment(searchTerm);
