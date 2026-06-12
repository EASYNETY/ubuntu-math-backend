/**
 * FIX ENROLLMENT - Your payment is complete but books were NOT added!
 * This will complete the enrollment process.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixEnrollment() {
  console.log('🔧 FIXING ENROLLMENT NOW...\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Define schemas
    const PaymentSchema = new mongoose.Schema({
      paymentId: String,
      userId: mongoose.Schema.Types.ObjectId,
      itemType: String,
      itemId: String,
      itemName: String,
      amount: Number,
      currency: String,
      status: String,
      enrollmentGranted: Boolean,
      enrolledAt: Date,
      completedAt: Date,
      evripayReference: String
    }, { collection: 'payments' });

    const UserSchema = new mongoose.Schema({
      email: String,
      name: String,
      purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlatformContent' }]
    }, { collection: 'users' });

    const BookSchema = new mongoose.Schema({
      title: String,
      author: String,
      slug: String,
      coverUrl: String,
      price: Number
    }, { collection: 'platformcontents' });

    const BookPurchaseSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      bookId: mongoose.Schema.Types.ObjectId,
      bundlePurchase: Boolean,
      amountPaid: Number,
      currency: String,
      paymentGateway: String,
      paymentReference: String,
      status: String
    }, { collection: 'bookpurchases' });

    const Payment = mongoose.model('Payment', PaymentSchema);
    const User = mongoose.model('User', UserSchema);
    const Book = mongoose.model('Book', BookSchema);
    const BookPurchase = mongoose.model('BookPurchase', BookPurchaseSchema);

    // Find the payment that needs fixing (Jude Kheng's payment)
    const payment = await Payment.findOne({ 
      paymentId: 'PAY-118f0253-4bfb-48e0-b39d-865cdc47ac8f'
    }).populate('userId', 'name email');

    if (!payment) {
      console.log('❌ Payment not found!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✓ Found your payment:');
    console.log(`   User: ${payment.userId?.name} (${payment.userId?.email})`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Enrollment Granted: ${payment.enrollmentGranted}`);
    console.log(`   Amount: ${payment.currency} ${payment.amount}`);
    console.log('');

    // Get all books
    console.log('Fetching books from database...');
    const allBooks = await Book.find({});
    console.log(`✓ Found ${allBooks.length} books\n`);

    if (allBooks.length === 0) {
      console.log('❌ ERROR: No books in database!');
      console.log('   Run: node batch-upload-books.js first');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Add books to user
    console.log('Adding books to your account...');
    const bookIds = allBooks.map(b => b._id);
    
    const updateResult = await User.findByIdAndUpdate(
      payment.userId,
      { $addToSet: { purchasedBooks: { $each: bookIds } } },
      { new: true }
    );

    console.log(`✓ Added ${bookIds.length} books to your account\n`);

    // Verify
    const user = await User.findById(payment.userId).select('email name purchasedBooks');
    console.log(`✓ Verification: ${user.purchasedBooks?.length || 0} books now in your account\n`);

    // Create purchase record
    console.log('Creating purchase record...');
    const existingPurchase = await BookPurchase.findOne({
      userId: payment.userId,
      bundlePurchase: true
    });

    if (!existingPurchase) {
      await BookPurchase.create({
        userId: payment.userId,
        bundlePurchase: true,
        amountPaid: payment.amount,
        currency: payment.currency,
        paymentGateway: 'evripay',
        paymentReference: payment.evripayReference,
        status: 'completed'
      });
      console.log('✓ Purchase record created\n');
    } else {
      console.log('✓ Purchase record already exists\n');
    }

    // Update payment to mark enrollment as granted
    console.log('Marking enrollment as granted...');
    payment.enrollmentGranted = true;
    payment.enrolledAt = new Date();
    await payment.save();
    console.log('✓ Enrollment granted!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! ENROLLMENT COMPLETED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Summary:');
    console.log(`   ✓ Books in account: ${user.purchasedBooks?.length || 0}`);
    console.log(`   ✓ Enrollment granted: ${payment.enrollmentGranted}`);
    console.log(`   ✓ User: ${user.name} (${user.email})`);
    console.log('');
    
    console.log('🔥 NOW DO THIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to website');
    console.log('2. LOG OUT');
    console.log('3. LOG BACK IN');
    console.log('4. Go to "My Library" (/my-library)');
    console.log('5. All 15 books will be there!');
    console.log('');
    console.log('WHY? You need a fresh login token.');
    console.log('The old token expired, causing 401 errors.');
    console.log('');

    await mongoose.connection.close();
    console.log('✓ Done!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixEnrollment();
