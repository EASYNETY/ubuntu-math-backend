/**
 * EMERGENCY FIX - Run this NOW to approve your bundle purchase
 * 
 * This script will:
 * 1. Find your pending bundle payment
 * 2. Approve it immediately
 * 3. Add all 15 books to your account
 * 4. Tell you what to do next
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function emergencyFix() {
  console.log('🚨 EMERGENCY FIX STARTING...\n');
  
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Define schemas inline (in case compiled models don't exist yet)
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
      evripayReference: String,
      createdAt: Date
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

    // Find YOUR bundle payment (most recent)
    console.log('Searching for your bundle purchase...\n');
    
    const bundlePayment = await Payment.findOne({ 
      itemId: 'bundle-15-books'
    }).sort({ createdAt: -1 }).populate('userId', 'name email');

    if (!bundlePayment) {
      console.log('❌ ERROR: No bundle payment found!');
      console.log('\nSearching for ANY book-related payments...\n');
      
      const anyPayment = await Payment.find({ 
        itemType: 'book'
      }).sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');
      
      if (anyPayment.length > 0) {
        console.log(`Found ${anyPayment.length} book payment(s):\n`);
        anyPayment.forEach((p, i) => {
          console.log(`${i + 1}. ${p.itemName}`);
          console.log(`   User: ${p.userId?.name || 'Unknown'}`);
          console.log(`   Status: ${p.status}`);
          console.log(`   Payment ID: ${p.paymentId}`);
          console.log('');
        });
      }
      
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✓ Found your bundle payment!');
    console.log(`   User: ${bundlePayment.userId?.name} (${bundlePayment.userId?.email})`);
    console.log(`   Amount: ${bundlePayment.currency} ${bundlePayment.amount}`);
    console.log(`   Current Status: ${bundlePayment.status}`);
    console.log(`   Payment ID: ${bundlePayment.paymentId}`);
    console.log(`   Reference: ${bundlePayment.evripayReference}`);
    console.log('');

    if (bundlePayment.status === 'completed' && bundlePayment.enrollmentGranted) {
      console.log('⚠️  This payment is ALREADY APPROVED!');
      console.log('   Checking if books were actually added...\n');
      
      const user = await User.findById(bundlePayment.userId);
      console.log(`   User has ${user.purchasedBooks?.length || 0} books in purchasedBooks array`);
      
      if ((user.purchasedBooks?.length || 0) >= 15) {
        console.log('\n✅ Books are already in your account!');
        console.log('\n🔥 THE PROBLEM IS YOUR JWT TOKEN!');
        console.log('\n=== YOU MUST DO THIS NOW ===');
        console.log('1. Go to the website');
        console.log('2. Click LOG OUT');
        console.log('3. LOG BACK IN with your email and password');
        console.log('4. Go to "My Library" page');
        console.log('5. Your 15 books should appear!');
        console.log('\nThe issue is your login token expired. Re-logging in will fix it.');
      } else {
        console.log('\n⚠️  Payment approved but books missing! Fixing now...\n');
        // Continue to add books
      }
    }

    // Approve the payment if not already
    if (bundlePayment.status !== 'completed') {
      console.log('Approving payment...');
      bundlePayment.status = 'completed';
      bundlePayment.completedAt = new Date();
      await bundlePayment.save();
      console.log('✓ Payment approved!\n');
    }

    // Get all books
    console.log('Fetching all books from database...');
    const allBooks = await Book.find({});
    console.log(`✓ Found ${allBooks.length} books\n`);

    if (allBooks.length === 0) {
      console.log('❌ ERROR: No books in database!');
      console.log('   You need to seed books first: node batch-upload-books.js');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Add books to user account
    console.log('Adding books to your account...');
    const bookIds = allBooks.map(b => b._id);
    
    await User.findByIdAndUpdate(bundlePayment.userId, {
      $addToSet: { purchasedBooks: { $each: bookIds } }
    });
    console.log(`✓ Added ${bookIds.length} books to your account\n`);

    // Verify
    const updatedUser = await User.findById(bundlePayment.userId);
    console.log(`✓ Your account now has ${updatedUser.purchasedBooks?.length || 0} books\n`);

    // Create purchase record if doesn't exist
    const existingPurchase = await BookPurchase.findOne({
      userId: bundlePayment.userId,
      bundlePurchase: true
    });

    if (!existingPurchase) {
      await BookPurchase.create({
        userId: bundlePayment.userId,
        bundlePurchase: true,
        amountPaid: bundlePayment.amount,
        currency: bundlePayment.currency,
        paymentGateway: 'evripay',
        paymentReference: bundlePayment.evripayReference,
        status: 'completed'
      });
      console.log('✓ Created purchase record\n');
    }

    // Mark enrollment as granted
    bundlePayment.enrollmentGranted = true;
    bundlePayment.enrolledAt = new Date();
    await bundlePayment.save();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS! YOUR BUNDLE IS NOW ACTIVE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔥 CRITICAL - YOU MUST DO THIS NOW:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to your website');
    console.log('2. Click PROFILE or your name');
    console.log('3. Click LOG OUT');
    console.log('4. LOG BACK IN with your email/password');
    console.log('5. Go to "My Library" page (/my-library)');
    console.log('6. You will see all 15 books!');
    console.log('7. Go to "Books" page (/books)');
    console.log('8. All books will show "Owned" badge');
    console.log('9. Click any book → Download button works!');
    console.log('\nWHY RE-LOGIN? Your old login token expired.');
    console.log('Re-logging in gives you a fresh 7-day token.\n');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    console.log('\n🎉 DONE! Now go log out and log back in!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

emergencyFix();
