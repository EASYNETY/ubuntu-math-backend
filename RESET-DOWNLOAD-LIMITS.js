require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const USER_EMAIL = 'jk@hospitality.com';

async function main() {
  console.log('\n🔄 Resetting Download Limits...\n');
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
  const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema({}, { strict: false, collection: 'analyticsevents' }));

  // Find user
  const user = await User.findOne({ email: USER_EMAIL });
  if (!user) {
    console.log(`❌ User not found: ${USER_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Found user: ${user.name} (${user.email})`);
  console.log(`User ID: ${user._id}\n`);

  // Find all purchases
  const purchases = await PlatformContent.find({
    userId: user._id,
    contentType: { $in: ['bookpurchase', 'product_purchase'] },
    status: 'completed'
  });

  console.log(`Found ${purchases.length} completed purchases\n`);

  let resetCount = 0;
  for (const purchase of purchases) {
    const currentCount = purchase.downloadCount || 0;
    if (currentCount > 0) {
      await PlatformContent.updateOne(
        { _id: purchase._id },
        { $set: { downloadCount: 0 } }
      );
      console.log(`✅ Reset download count for ${purchase.productType || 'product'} (was: ${currentCount}, now: 0)`);
      resetCount++;
    }
  }

  if (resetCount === 0) {
    console.log('✅ All download counts already at 0');
  } else {
    console.log(`\n✅ Reset ${resetCount} download counts`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Done\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
