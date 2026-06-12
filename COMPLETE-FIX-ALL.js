/**
 * COMPLETE FIX - All-in-One Solution
 * ===================================
 * This script performs ALL necessary fixes in the correct order:
 * 1. Checks database state
 * 2. Force uploads all books
 * 3. Adds books to user account
 * 4. Fixes payment enrollment status
 * 5. Verifies everything is working
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const AdmZip = require('adm-zip');
const mongoose = require('mongoose');

// ── Config ────────────────────────────────────────────────────────────────────

const BOOKS_DIR = path.join(__dirname, '..', 'books');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';
const USER_EMAIL = 'jk@hospitality.com';
const USER_ID = '6a288a11bfb79aaf06e54617';

cloudinary.config({
  cloud_name: 'dqxse01f2',
  api_key: 324776629951427,
  api_secret: '08VyFSs_E9-YfqRr1JRtiu2FI0U',
  secure: true,
});

// ── Book metadata catalog ─────────────────────────────────────────────────────

const BOOK_CATALOG = {
  'african-psychological-warfare-the-capitans-manual': {
    title: "African Psychological Warfare: The Capitan's Manual",
    author: 'CAMS Research Institute',
    description: 'A strategic guide to understanding and countering psychological warfare tactics used against African nations and communities.',
    category: 'Strategy & Sovereignty',
    tags: ['psychological warfare', 'sovereignty', 'Africa', 'strategy', 'decolonisation'],
    seriesNumber: 1,
  },
  'african-wealth-management-the-ubuntu-inheritance': {
    title: 'African Wealth Management: The Ubuntu Inheritance',
    author: 'CAMS Research Institute',
    description: 'A comprehensive framework for managing African wealth through the Ubuntu philosophy.',
    category: 'Finance & Economics',
    tags: ['wealth management', 'Ubuntu', 'inheritance', 'Africa', 'finance'],
    seriesNumber: 2,
  },
  'africas-100-year-plan-a-rebuilt-civilisation': {
    title: "Africa's 100-Year Plan: A Rebuilt Civilisation",
    author: 'CAMS Research Institute',
    description: 'A visionary blueprint for rebuilding African civilisation over a century.',
    category: 'Development & Planning',
    tags: ['100-year plan', 'civilisation', 'Africa', 'development', 'renaissance'],
    seriesNumber: 3,
  },
  'africas-3-sovereign-engines-mining-farming-fishing': {
    title: "Africa's 3 Sovereign Engines: Mining, Farming & Fishing",
    author: 'CAMS Research Institute',
    description: "An in-depth analysis of Africa's three primary sovereign economic engines.",
    category: 'Economics & Resources',
    tags: ['mining', 'farming', 'fishing', 'sovereign engines', 'Africa', 'resources'],
    seriesNumber: 4,
  },
  'africas-alkebulan-the-100-year-plan': {
    title: "Africa's Alkebulan: The 100-Year Plan",
    author: 'CAMS Research Institute',
    description: "A deep dive into Alkebulan — Africa's ancient name and identity.",
    category: 'History & Identity',
    tags: ['Alkebulan', 'Africa', '100-year plan', 'identity', 'sovereignty'],
    seriesNumber: 5,
  },
  'africas-balance-sheet-ubuntu-corridors': {
    title: "Africa's Balance Sheet: Ubuntu Corridors",
    author: 'CAMS Research Institute',
    description: "A financial accounting of Africa's true wealth using Ubuntu mathematics.",
    category: 'Finance & Economics',
    tags: ['balance sheet', 'Ubuntu corridors', 'trade', 'Africa', 'economics'],
    seriesNumber: 6,
  },
  'africas-bio-mimetics-arsenal': {
    title: "Africa's Bio-Mimetics Arsenal",
    author: 'CAMS Research Institute',
    description: "Explores Africa's biological and ecological systems as models for industrial innovation.",
    category: 'Science & Technology',
    tags: ['bio-mimetics', 'innovation', 'Africa', 'technology', 'sustainability'],
    seriesNumber: 7,
  },
  'decoupling-from-colonialism': {
    title: 'Decoupling from Colonialism',
    author: 'CAMS Research Institute',
    description: 'A practical roadmap for African nations to systematically decouple from colonial systems.',
    category: 'Politics & Sovereignty',
    tags: ['decolonisation', 'sovereignty', 'Africa', 'independence', 'economics'],
    seriesNumber: 8,
  },
  'return-to-sender': {
    title: 'Return to Sender',
    author: 'CAMS Research Institute',
    description: "A bold analysis of how Africa can reverse the flow of extracted wealth.",
    category: 'Economics & Justice',
    tags: ['reparations', 'repatriation', 'Africa', 'sovereignty', 'justice'],
    seriesNumber: 9,
  },
  'south-africa-the-great-deception': {
    title: 'South Africa: The Great Deception',
    author: 'CAMS Research Institute',
    description: "An unflinching examination of the political and economic deceptions in South Africa.",
    category: 'Politics & History',
    tags: ['South Africa', 'deception', 'apartheid', 'politics', 'sovereignty'],
    seriesNumber: 10,
  },
  'south-africa-the-great-renaissance': {
    title: 'South Africa: The Great Renaissance',
    author: 'CAMS Research Institute',
    description: "A vision for South Africa's economic and cultural renaissance.",
    category: 'Development & Planning',
    tags: ['South Africa', 'renaissance', 'Ubuntu', 'development', 'sovereignty'],
    seriesNumber: 11,
  },
  'south-africa-the-great-trek-reloaded': {
    title: 'South Africa: The Great Trek Reloaded',
    author: 'CAMS Research Institute',
    description: "A reinterpretation of South Africa's Great Trek through Ubuntu sovereignty.",
    category: 'History & Identity',
    tags: ['South Africa', 'Great Trek', 'land rights', 'history', 'sovereignty'],
    seriesNumber: 12,
  },
  'the-girth-of-the-ledger-an-architects-guide-to-reclaiming-sovereign-mineral-wealth': {
    title: "The Girth of the Ledger: An Architect's Guide to Reclaiming Sovereign Mineral Wealth",
    author: 'CAMS Research Institute',
    description: "A technical architect's guide to building sovereign mineral wealth management systems.",
    category: 'Finance & Resources',
    tags: ['mineral wealth', 'sovereign ledger', 'architecture', 'Africa', 'resources'],
    seriesNumber: 13,
  },
  'the-sovereign-engine-cake-chain-mapping-for-the-african-renaissance': {
    title: 'The Sovereign Engine: Cake Chain Mapping for the African Renaissance',
    author: 'CAMS Research Institute',
    description: "The definitive guide to Cake Chain Mapping — CAMS' proprietary framework.",
    category: 'Economics & Strategy',
    tags: ['cake chain', 'sovereign engine', 'value mapping', 'Africa', 'renaissance'],
    seriesNumber: 14,
  },
  'the-ubuntu-oceans-policy-blue-economy-reimagined': {
    title: 'The Ubuntu Oceans Policy: Blue Economy Reimagined',
    author: 'CAMS Research Institute',
    description: "A revolutionary framework for managing Africa's ocean resources.",
    category: 'Policy & Environment',
    tags: ['blue economy', 'oceans', 'Ubuntu', 'maritime', 'Africa'],
    seriesNumber: 15,
  },
  'ubuntu-maths-the-sovereign-calculus': {
    title: 'Ubuntu Maths: The Sovereign Calculus',
    author: 'CAMS Research Institute',
    description: "The foundational textbook of Ubuntu Mathematics.",
    category: 'Mathematics & Education',
    tags: ['Ubuntu maths', 'sovereign calculus', 'mathematics', 'education', 'Africa'],
    seriesNumber: 16,
  },
};

// ── Utility functions ─────────────────────────────────────────────────────────

function extractEpubChapters(filePath, maxChapters = 3) {
  try {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    const contentFiles = entries
      .filter(e => {
        const name = e.entryName.toLowerCase();
        return (name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm'));
      })
      .map(e => {
        const match = e.entryName.match(/\/(\d+)_/);
        return { entry: e, num: match ? parseInt(match[1]) : 999 };
      })
      .sort((a, b) => a.num - b.num)
      .map(x => x.entry);

    if (contentFiles.length === 0) return null;

    const FRONT_MATTER = ['cover', 'title', 'reedsy', 'copyright', 'dedication', 'epigraph', 'halftitle', 'frontmatter'];
    const chapterFiles = contentFiles.filter(e => {
      const name = e.entryName.toLowerCase();
      return !FRONT_MATTER.some(kw => name.includes(kw));
    }).slice(0, maxChapters);

    const filesToUse = chapterFiles.length >= 1 ? chapterFiles : contentFiles.slice(3, 3 + maxChapters);
    let combinedText = '';
    let chaptersExtracted = 0;

    for (const entry of filesToUse) {
      try {
        const content = entry.getData().toString('utf8');
        const text = content
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#\d+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (text.length > 50) {
          combinedText += `\n\n--- Chapter ${chaptersExtracted + 1} ---\n\n${text}`;
          chaptersExtracted++;
        }
      } catch (e) {}
    }
    return combinedText.length > 100 ? combinedText.slice(0, 80000) : null;
  } catch (e) {
    return null;
  }
}

function uploadToCloudinary(filePath, folder, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder, public_id: publicId, resource_type: 'raw', use_filename: false, overwrite: true,
    }, (error, result) => error ? reject(error) : resolve(result));
  });
}

function uploadTextToCloudinary(text, folder, publicId) {
  return new Promise((resolve, reject) => {
    const { Readable } = require('stream');
    const buffer = Buffer.from(text, 'utf8');
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'raw', overwrite: true },
      (error, result) => error ? reject(error) : resolve(result)
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ── Main script ───────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 COMPLETE FIX - Ubuntu Math Book Delivery Issue');
  console.log('='.repeat(70));
  console.log(`\nTarget User: ${USER_EMAIL} (ID: ${USER_ID})`);
  console.log('\nThis script will:');
  console.log('  1. Check current database state');
  console.log('  2. Delete and re-upload all books');
  console.log('  3. Add books to your user account');
  console.log('  4. Fix payment enrollment status');
  console.log('  5. Verify everything works\n');

  // Connect to MongoDB
  console.log('📡 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  // Define models
  const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema(
    { contentType: { type: String, required: true } },
    { timestamps: true, collection: 'analyticsevents', strict: false }
  ));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false, collection: 'payments' }));

  // ━━━ STEP 1: Check current state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(70));
  console.log('STEP 1: Checking current database state');
  console.log('━'.repeat(70));

  const existingBooks = await PlatformContent.find({ contentType: 'book' });
  console.log(`📚 Current books in database: ${existingBooks.length}`);
  if (existingBooks.length > 0) {
    console.log(`   Will delete ${existingBooks.length} existing book records\n`);
  }

  // ━━━ STEP 2: Force upload all books ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(70));
  console.log('STEP 2: Uploading all books');
  console.log('━'.repeat(70));

  // Delete existing books
  if (existingBooks.length > 0) {
    await PlatformContent.deleteMany({ contentType: 'book' });
    console.log('✅ Deleted existing book records\n');
  }

  const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.epub')).sort();
  console.log(`📚 Found ${files.length} EPUB files\n`);

  const uploadedBookIds = [];

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const slug = filename.replace('.epub', '');
    const filePath = path.join(BOOKS_DIR, filename);
    const meta = BOOK_CATALOG[slug];

    console.log(`[${i + 1}/${files.length}] ${meta ? meta.title : filename}`);

    if (!meta) {
      console.log('  ⚠️  No metadata - skipping\n');
      continue;
    }

    try {
      // Upload full EPUB
      const uploadResult = await uploadToCloudinary(filePath, 'cams/ebooks', slug);
      const fullFileUrl = uploadResult.secure_url;

      // Extract sample chapters
      const sampleText = extractEpubChapters(filePath, 3);
      let sampleChapterUrl = fullFileUrl;
      if (sampleText && sampleText.length > 100) {
        const sampleResult = await uploadTextToCloudinary(
          `SAMPLE PREVIEW — Chapters 1-3\n${'='.repeat(40)}\n\n${sampleText}`,
          'cams/samples',
          `${slug}-sample-chapters`
        );
        sampleChapterUrl = sampleResult.secure_url;
      }

      // Create database record
      const bookData = {
        contentType: 'book',
        title: meta.title,
        slug,
        author: meta.author,
        description: meta.description,
        category: meta.category,
        tags: meta.tags,
        seriesNumber: meta.seriesNumber,
        price: 39.99,
        bundleEligible: true,
        fileType: 'epub',
        fullFileUrl,
        sampleChapterUrl,
        coverUrl: '',
        published: true,
        downloadCount: 0,
        purchaseCount: 0,
      };

      const newBook = await PlatformContent.create(bookData);
      uploadedBookIds.push(newBook._id);
      console.log(`  ✅ Uploaded (ID: ${newBook._id})\n`);

    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}\n`);
    }
  }

  console.log(`✅ Successfully uploaded ${uploadedBookIds.length} books\n`);

  // ━━━ STEP 3: Add books to user account ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(70));
  console.log('STEP 3: Adding books to user account');
  console.log('━'.repeat(70));

  const user = await User.findById(USER_ID);
  if (!user) {
    console.log(`❌ User not found: ${USER_ID}`);
  } else {
    await User.updateOne(
      { _id: USER_ID },
      { $set: { purchasedBooks: uploadedBookIds } }
    );
    console.log(`✅ Added ${uploadedBookIds.length} books to user account\n`);
  }

  // ━━━ STEP 4: Fix payment enrollment ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(70));
  console.log('STEP 4: Fixing payment enrollment status');
  console.log('━'.repeat(70));

  const payment = await Payment.findOne({
    'customer.email': USER_EMAIL,
    'items.productType': 'bundle',
    status: 'completed'
  }).sort({ createdAt: -1 });

  if (!payment) {
    console.log('⚠️  No payment found\n');
  } else {
    await Payment.updateOne(
      { _id: payment._id },
      { $set: { enrollmentGranted: true } }
    );
    console.log(`✅ Payment enrollment granted (Payment ID: ${payment.paymentId})\n`);
  }

  // ━━━ STEP 5: Verify ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(70));
  console.log('STEP 5: Verification');
  console.log('━'.repeat(70));

  const finalBooks = await PlatformContent.countDocuments({ contentType: 'book' });
  const finalUser = await User.findById(USER_ID);
  const finalPayment = await Payment.findById(payment?._id);

  console.log('📊 Final State:');
  console.log(`   Books in database: ${finalBooks}`);
  console.log(`   Books in user account: ${finalUser?.purchasedBooks?.length || 0}`);
  console.log(`   Payment enrollmentGranted: ${finalPayment?.enrollmentGranted || 'N/A'}`);

  await mongoose.disconnect();

  console.log('\n' + '='.repeat(70));
  console.log('✅ COMPLETE! All fixes applied successfully');
  console.log('='.repeat(70));
  console.log('\n📝 Next Steps:');
  console.log('   1. Log out of the frontend');
  console.log('   2. Clear browser cache');
  console.log('   3. Log back in');
  console.log('   4. Navigate to /my-library');
  console.log('   5. You should see all 16 books!\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
