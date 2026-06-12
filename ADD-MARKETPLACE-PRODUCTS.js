/**
 * ADD-MARKETPLACE-PRODUCTS.js
 * 
 * Creates marketplace product records in the database with their file URLs.
 * These products can then be purchased and accessed dynamically without
 * hardcoding URLs in environment variables.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Marketplace products with their Cloudinary URLs
const MARKETPLACE_PRODUCTS = [
  {
    productId: 'cams-industrial-cookbook',
    title: 'CAMS Industrial Cookbook',
    description: 'Comprehensive guide to industrial processes and manufacturing techniques. Small-scale recipes for soap, food, medicine & materials.',
    price: 9.99,
    currency: 'USD',
    fileUrl: 'https://res.cloudinary.com/dqxse01f2/raw/upload/v1781294239/cams/marketplace/cams-industrial-cookbook.docx',
    fileType: 'docx',
    category: 'industrial-manufacturing',
    published: true,
    featured: true,
  },
  {
    productId: 'cams-master-index',
    title: 'CAMS Master Index',
    description: 'Complete index and reference guide for CAMS resources. Navigate the entire CAMS knowledge base efficiently.',
    price: 9.99,
    currency: 'USD',
    fileUrl: 'https://res.cloudinary.com/dqxse01f2/raw/upload/v1781294240/cams/marketplace/cams-master-index.docx',
    fileType: 'docx',
    category: 'reference-documentation',
    published: true,
    featured: true,
  },
  {
    productId: 'patent-dossier',
    title: 'CAMS Industrial Patent Dossier',
    description: 'Complete industrial patent documentation and technical specifications. 388 patents covering manufacturing, food processing, materials science, and sustainable technology.',
    price: 1000,
    currency: 'USD',
    fileUrl: 'https://res.cloudinary.com/placeholder/patent-dossier.pdf', // Update when available
    fileType: 'pdf',
    category: 'patents-intellectual-property',
    published: true,
    featured: true,
  },
];

async function addMarketplaceProducts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema({}, {
      strict: false,
      collection: 'analyticsevents'
    }));

    console.log('\n📦 Adding marketplace products...\n');

    for (const product of MARKETPLACE_PRODUCTS) {
      // Check if product already exists
      const existing = await PlatformContent.findOne({
        contentType: 'marketplace_product',
        productId: product.productId
      });

      if (existing) {
        console.log(`⚠️  Product "${product.title}" already exists - updating...`);
        await PlatformContent.findByIdAndUpdate(existing._id, {
          ...product,
          contentType: 'marketplace_product',
          updatedAt: new Date()
        });
        console.log(`✅ Updated: ${product.title}`);
      } else {
        const newProduct = await PlatformContent.create({
          ...product,
          contentType: 'marketplace_product',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created: ${product.title} (ID: ${newProduct._id})`);
      }

      console.log(`   - Product ID: ${product.productId}`);
      console.log(`   - Price: ${product.currency} ${product.price}`);
      console.log(`   - File URL: ${product.fileUrl}`);
      console.log('');
    }

    console.log('\n🎉 All marketplace products added successfully!');
    console.log('\nℹ️  These products are now stored in the database and can be:');
    console.log('   - Purchased through the payment flow');
    console.log('   - Accessed dynamically without environment variables');
    console.log('   - Updated through admin interfaces');

  } catch (error) {
    console.error('❌ Error adding marketplace products:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

addMarketplaceProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
