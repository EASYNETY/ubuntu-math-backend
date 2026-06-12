require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';
const USER_EMAIL = 'jk@hospitality.com';

async function main() {
  console.log('\n🔧 Fixing Payment Enrollment Status...\n');
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));
  
  // Find the user's bundle payment
  const payment = await Payment.findOne({
    'customer.email': USER_EMAIL,
    'items.productType': 'bundle',
    status: 'completed'
  }).sort({ createdAt: -1 });

  if (!payment) {
    console.log('❌ No completed bundle payment found for', USER_EMAIL);
    await mongoose.disconnect();
    return;
  }

  console.log('📦 Found payment:');
  console.log(`   ID: ${payment.paymentId}`);
  console.log(`   Amount: ${payment.amount} ${payment.currency}`);
  console.log(`   Status: ${payment.status}`);
  console.log(`   Current enrollmentGranted: ${payment.enrollmentGranted}`);

  if (payment.enrollmentGranted === true) {
    console.log('\n✅ Enrollment already granted!');
    await mongoose.disconnect();
    return;
  }

  // Update the payment
  await Payment.updateOne(
    { _id: payment._id },
    { 
      $set: { 
        enrollmentGranted: true,
        updatedAt: new Date()
      }
    }
  );

  console.log('\n✅ Updated payment - enrollmentGranted set to TRUE');
  
  // Verify
  const updated = await Payment.findById(payment._id);
  console.log('✅ Verified - enrollmentGranted:', updated.enrollmentGranted);

  await mongoose.disconnect();
  console.log('\n✅ Done\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
