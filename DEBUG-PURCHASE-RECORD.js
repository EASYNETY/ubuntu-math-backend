/**
 * DEBUG-PURCHASE-RECORD.js
 * Check what productType is stored in the purchase record
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema({}, {
      strict: false,
      collection: 'analyticsevents'
    }));

    // Find the purchase record
    const purchase = await PlatformContent.findOne({
      _id: '6a2c5bebeeede0ffc90e9404',
    });

    console.log('📦 Purchase Record:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', purchase._id);
    console.log('Content Type:', purchase.contentType);
    console.log('Product Type:', purchase.productType);
    console.log('Product ID:', purchase.productId);
    console.log('User ID:', purchase.userId);
    console.log('Amount Paid:', purchase.amountPaid);
    console.log('Download Count:', purchase.downloadCount);
    console.log('\n🔍 Now searching for marketplace product...\n');

    // Search for marketplace product using the productType
    const marketplaceProduct = await PlatformContent.findOne({
      contentType: 'marketplace_product',
      productId: purchase.productType
    });

    if (marketplaceProduct) {
      console.log('✅ Found marketplace product:');
      console.log('   Title:', marketplaceProduct.title);
      console.log('   Product ID:', marketplaceProduct.productId);
      console.log('   File URL:', marketplaceProduct.fileUrl);
    } else {
      console.log('❌ NO marketplace product found!');
      console.log('   Searched for productId:', purchase.productType);
      
      console.log('\n📋 All marketplace products in database:');
      const allProducts = await PlatformContent.find({ contentType: 'marketplace_product' });
      allProducts.forEach(p => {
        console.log(`   - ${p.productId}: ${p.title}`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debug();
