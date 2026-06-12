const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Quick Fix Script for User's Bundle Purchase
 * 
 * This script finds the most recent pending bundle purchase and approves it.
 * Run this immediately after deploying the fixes.
 */

async function fixBundlePurchase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Load models
    const Payment = require('./dist/models/Payment').default;
    const User = require('./dist/models/User').default;
    const { Book, BookPurchase } = require('./dist/models/PlatformContent');

    // Find most recent pending bundle payment
    const payment = await Payment.findOne({ 
      itemId: 'bundle-15-books',
      status: 'pending'
    }).sort({ createdAt: -1 }).populate('userId', 'name email');

    if (!payment) {
      console.log('❌ No pending bundle payment found');
      console.log('\nSearching for ALL bundle payments (any status)...\n');
      
      const allBundlePayments = await Payment.find({ 
        itemId: 'bundle-15-books'
      }).sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');
      
      if (allBundlePayments.length === 0) {
        console.log('❌ No bundle payments found at all');
        await mongoose.connection.close();
        return;
      }
      
      console.log(`Found ${allBundlePayments.length} bundle payment(s):\n`);
      allBundlePayments.forEach((p, i) => {
        console.log(`${i + 1}. Payment ID: ${p.paymentId}`);
        console.log(`   User: ${p.userId?.name} (${p.userId?.email})`);
        console.log(`   Status: ${p.status}`);
        console.log(`   Amount: ${p.currency} ${p.amount}`);
        console.log(`   Created: ${p.createdAt}`);
        if (p.status === 'completed') {
          console.log(`   ✓ Completed: ${p.completedAt}`);
          console.log(`   ✓ Enrollment Granted: ${p.enrollmentGranted}`);
        }
        console.log('');
      });
      
      await mongoose.connection.close();
      return;
    }

    console.log('=== Found Pending Bundle Payment ===');
    console.log(`Payment ID: ${payment.paymentId}`);
    console.log(`User: ${payment.userId?.name} (${payment.userId?.email})`);
    console.log(`User ID: ${payment.userId?._id}`);
    console.log(`Amount: ${payment.currency} ${payment.amount}`);
    console.log(`Reference: ${payment.evripayReference}`);
    console.log(`Created: ${payment.createdAt}`);
    console.log('');

    // Update payment status
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();
    console.log('✓ Payment status updated to: completed\n');

    // Get all books
    console.log('=== Processing Bundle Purchase ===');
    const allBooks = await Book.find({});
    const bookIds = allBooks.map(b => b._id);
    
    console.log(`Found ${bookIds.length} books in database`);
    
    if (bookIds.length === 0) {
      console.error('❌ WARNING: No books found in database!');
      console.error('   The bundle was approved but no books were added.');
      console.error('   You need to seed books first: node batch-upload-books.js');
    } else {
      // Add all books to user's purchased books
      const result = await User.findByIdAndUpdate(payment.userId, {
        $addToSet: { purchasedBooks: { $each: bookIds } }
      }, { new: true });
      
      console.log(`✓ Added ${bookIds.length} books to user's purchasedBooks array`);
      
      // Verify the update
      const user = await User.findById(payment.userId);
      console.log(`✓ User now has ${user.purchasedBooks?.length || 0} books in their library`);

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
    }

    payment.enrollmentGranted = true;
    payment.enrolledAt = new Date();
    await payment.save();

    console.log('\n✅ BUNDLE PURCHASE APPROVED SUCCESSFULLY!');
    console.log('\n=== User Action Required ===');
    console.log('Tell the user to:');
    console.log('1. Log out and log back in (to refresh JWT token)');
    console.log('2. Navigate to "My Library" page at /my-library');
    console.log(`3. They should now see ${bookIds.length} books!`);
    console.log('4. Books page at /books should show "Owned" badges');

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixBundlePurchase();
