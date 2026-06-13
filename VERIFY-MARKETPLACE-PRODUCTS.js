/**
 * VERIFY-MARKETPLACE-PRODUCTS.js
 * Verify marketplace products are correctly stored in database
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema({}, {
      strict: false,
      collection: 'analyticsevents'
    }));

    const products = await PlatformContent.find({ contentType: 'marketplace_product' });

    console.log(`📦 Found ${products.length} marketplace products:\n`);

    products.forEach(p => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`✅ ${p.title}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Product ID: ${p.productId}`);
      console.log(`   Price: ${p.currency} ${p.price}`);
      console.log(`   File: ${p.fileUrl}`);
      console.log(`   Published: ${p.published}`);
      console.log(`   Featured: ${p.featured}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Verification complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verify();
