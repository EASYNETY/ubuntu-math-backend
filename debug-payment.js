const mongoose = require('mongoose');
require('dotenv').config();

async function debugPayment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the Payment model
    const Payment = mongoose.model('Payment', new mongoose.Schema({
      paymentId: String,
      userId: mongoose.Schema.Types.ObjectId,
      itemType: String,
      itemId: String,
      itemName: String,
      amount: Number,
      status: String,
      enrollmentGranted: Boolean,
      createdAt: Date
    }), 'payments');

    // Find recent bundle purchases
    const payments = await Payment.find({ 
      itemId: { $regex: /bundle/i }
    }).sort({ createdAt: -1 }).limit(5);

    console.log('\n=== Bundle Payments ===');
    payments.forEach(p => {
      console.log({
        paymentId: p.paymentId,
        userId: p.userId,
        itemType: p.itemType,
        itemId: p.itemId,
        itemName: p.itemName,
        status: p.status,
        enrollmentGranted: p.enrollmentGranted,
        createdAt: p.createdAt
      });
    });

    // Find pending payments
    const pending = await Payment.find({ 
      status: 'pending' 
    }).sort({ createdAt: -1 }).limit(5).populate('userId', 'name email');

    console.log('\n=== Recent Pending Payments ===');
    pending.forEach(p => {
      console.log({
        paymentId: p.paymentId,
        user: p.userId ? `${p.userId.name} (${p.userId.email})` : 'Unknown',
        itemType: p.itemType,
        itemId: p.itemId,
        itemName: p.itemName,
        amount: p.amount,
        createdAt: p.createdAt
      });
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugPayment();
