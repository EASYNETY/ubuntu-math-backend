/**
 * FIX-EXISTING-PURCHASE.js
 * Fix the existing purchase record that's missing productType field
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema({}, {
      strict: false,
      collection: 'analyticsevents'
    }));

    // Find the broken purchase
    const purchase = await PlatformContent.findOne({
      _id: '6a2c5bebeeede0ffc90e9404',
      contentType: 'product_purchase'
    });

    if (!purchase) {
      console.log('❌ Purchase not found!');
      return;
    }

    console.log('📦 Current Purchase Record:');
    console.log('   Title:', purchase.title);
    console.log('   Product Type:', purchase.productType);
    console.log('   Amount:', purchase.amountPaid);
    console.log('');

    // Determine which product this is based on the payment
    // Check the Payment collection for this purchase
    const Payment = mongoose.model('Payment', new mongoose.Schema({}, {
      strict: false,
      collection: 'payments'
    }));

    const payments = await Payment.find({
      userId: purchase.userId,
      amount: purchase.amountPaid,
      status: 'completed'
    }).sort({ createdAt: -1 }).limit(5);

    console.log(`🔍 Found ${payments.length} matching payments:`);
    payments.forEach(p => {
      console.log(`   - ${p.itemId || p.itemName} (${p.amount})`);
    });

    // Most recent matching payment
    const matchingPayment = payments[0];
    
    if (matchingPayment && matchingPayment.itemId) {
      console.log(`\n✅ Found matching payment with itemId: ${matchingPayment.itemId}`);
      console.log('   Updating purchase record...\n');

      await PlatformContent.findByIdAndUpdate(purchase._id, {
        productType: matchingPayment.itemId,
        productId: matchingPayment.itemId,
        downloadCount: purchase.downloadCount || 0,
        maxDownloads: 100
      });

      console.log('✅ Purchase record updated successfully!');
      console.log(`   Product Type: ${matchingPayment.itemId}`);
      
      // Verify the marketplace product exists
      const marketplaceProduct = await PlatformContent.findOne({
        contentType: 'marketplace_product',
        productId: matchingPayment.itemId
      });

      if (marketplaceProduct) {
        console.log(`✅ Marketplace product found: ${marketplaceProduct.title}`);
        console.log(`   File URL: ${marketplaceProduct.fileUrl}`);
      } else {
        console.log(`❌ Warning: No marketplace product found for ${matchingPayment.itemId}`);
      }
    } else {
      console.log('❌ Could not determine product type from payments');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fix();
