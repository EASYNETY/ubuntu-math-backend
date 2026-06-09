const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Clear all payments
    const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }), 'payments');
    const deleteResult = await Payment.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} payments`);

    // Clear all purchased books from users
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const userUpdate = await User.updateMany(
      { purchasedBooks: { $exists: true } },
      { $set: { purchasedBooks: [] } }
    );
    console.log(`✅ Cleared purchased books from ${userUpdate.modifiedCount} users`);

    // Clear all marketplace purchases (PlatformContent)
    const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema({}, { strict: false }), 'platformcontents');
    const marketplaceDelete = await PlatformContent.deleteMany({
      contentType: { $in: ['product_purchase', 'bookpurchase'] }
    });
    console.log(`✅ Deleted ${marketplaceDelete.deletedCount} marketplace purchases`);

    // Clear all enrollments
    const Enrollment = mongoose.model('Enrollment', new mongoose.Schema({}, { strict: false }), 'enrollments');
    const enrollmentDelete = await Enrollment.deleteMany({});
    console.log(`✅ Deleted ${enrollmentDelete.deletedCount} enrollments`);

    console.log('\n🎉 All payments and purchases cleared successfully!');
    console.log('Users can now make fresh purchases.');

  } catch (error) {
    console.error('❌ Error clearing payments:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
});
