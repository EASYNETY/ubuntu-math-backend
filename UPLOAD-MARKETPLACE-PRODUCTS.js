/**
 * Upload Marketplace Products to Cloudinary
 * ==========================================
 * Uploads Word/PDF documents for marketplace products
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');

const BOOKS_DIR = path.join(__dirname, '..', 'books');

cloudinary.config({
  cloud_name: 'dqxse01f2',
  api_key: 324776629951427,
  api_secret: '08VyFSs_E9-YfqRr1JRtiu2FI0U',
  secure: true,
});

const MARKETPLACE_PRODUCTS = [
  {
    filename: 'CAMS Master Cookbook.docx',
    publicId: 'cams-industrial-cookbook',
    envVar: 'COOKBOOK_URL',
    title: 'CAMS Industrial Cookbook'
  },
  {
    filename: 'CAMS Master Index.docx',
    publicId: 'cams-master-index',
    envVar: 'MASTER_INDEX_URL',
    title: 'CAMS Master Index'
  }
];

function uploadToCloudinary(filePath, folder, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder,
      public_id: publicId,
      resource_type: 'raw',
      use_filename: false,
      overwrite: true,
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

async function main() {
  console.log('\n📦 Uploading Marketplace Products to Cloudinary');
  console.log('='.repeat(60));

  const results = { success: [], failed: [] };

  for (const product of MARKETPLACE_PRODUCTS) {
    const filePath = path.join(BOOKS_DIR, product.filename);
    
    console.log(`\n📄 ${product.title}`);
    console.log(`   File: ${product.filename}`);

    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found!`);
      results.failed.push({ product: product.title, error: 'File not found' });
      continue;
    }

    try {
      console.log(`   ⬆️  Uploading to Cloudinary...`);
      const uploadResult = await uploadToCloudinary(
        filePath,
        'cams/marketplace',
        product.publicId
      );

      console.log(`   ✅ Uploaded successfully!`);
      console.log(`   URL: ${uploadResult.secure_url}`);
      console.log(`   \nAdd to .env:`);
      console.log(`   ${product.envVar}=${uploadResult.secure_url}`);

      results.success.push({
        product: product.title,
        url: uploadResult.secure_url,
        envVar: product.envVar
      });

    } catch (err) {
      console.error(`   ❌ Upload failed: ${err.message}`);
      results.failed.push({ product: product.title, error: err.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Uploaded: ${results.success.length}`);
  console.log(`❌ Failed:   ${results.failed.length}`);

  if (results.success.length > 0) {
    console.log('\n✅ Successfully uploaded:');
    results.success.forEach(r => {
      console.log(`   • ${r.product}`);
      console.log(`     ${r.envVar}=${r.url}`);
    });
    
    console.log('\n📝 Update your .env file on Render with these URLs!');
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(f => console.log(`   • ${f.product}: ${f.error}`));
  }

  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
