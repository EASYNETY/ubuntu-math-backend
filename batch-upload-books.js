/**
 * CAMS Books Batch Upload Script
 * ================================
 * Uploads all EPUBs from ../books/ to Cloudinary,
 * extracts chapters 1-3 as sample content,
 * and seeds the database with full book metadata.
 *
 * Usage:
 *   node batch-upload-books.js
 *
 * Required env vars (in .env):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   MONGODB_URI
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

cloudinary.config({
  cloud_name: 'dqxse01f2',
  api_key:    324776629951427,
  api_secret: '08VyFSs_E9-YfqRr1JRtiu2FI0U',
  secure: true,
});

// ── Book metadata catalog ─────────────────────────────────────────────────────
// Maps filename slug → full metadata

const BOOK_CATALOG = {
  'african-psychological-warfare-the-capitans-manual': {
    title: "African Psychological Warfare: The Capitan's Manual",
    author: 'CAMS Research Institute',
    description: 'A strategic guide to understanding and countering psychological warfare tactics used against African nations and communities. Covers cognitive sovereignty, narrative control, and mental decolonisation.',
    category: 'Strategy & Sovereignty',
    tags: ['psychological warfare', 'sovereignty', 'Africa', 'strategy', 'decolonisation'],
    seriesNumber: 1,
  },
  'african-wealth-management-the-ubuntu-inheritance': {
    title: 'African Wealth Management: The Ubuntu Inheritance',
    author: 'CAMS Research Institute',
    description: 'A comprehensive framework for managing African wealth through the Ubuntu philosophy. Covers intergenerational wealth transfer, communal investment models, and sovereign financial instruments.',
    category: 'Finance & Economics',
    tags: ['wealth management', 'Ubuntu', 'inheritance', 'Africa', 'finance'],
    seriesNumber: 2,
  },
  'africas-100-year-plan-a-rebuilt-civilisation': {
    title: "Africa's 100-Year Plan: A Rebuilt Civilisation",
    author: 'CAMS Research Institute',
    description: 'A visionary blueprint for rebuilding African civilisation over a century. Covers infrastructure, education, governance, technology, and cultural renaissance across the continent.',
    category: 'Development & Planning',
    tags: ['100-year plan', 'civilisation', 'Africa', 'development', 'renaissance'],
    seriesNumber: 3,
  },
  'africas-3-sovereign-engines-mining-farming-fishing': {
    title: "Africa's 3 Sovereign Engines: Mining, Farming & Fishing",
    author: 'CAMS Research Institute',
    description: "An in-depth analysis of Africa's three primary sovereign economic engines. Covers resource extraction mathematics, agricultural sovereignty, and blue economy frameworks using Ubuntu value models.",
    category: 'Economics & Resources',
    tags: ['mining', 'farming', 'fishing', 'sovereign engines', 'Africa', 'resources'],
    seriesNumber: 4,
  },
  'africas-alkebulan-the-100-year-plan': {
    title: "Africa's Alkebulan: The 100-Year Plan",
    author: 'CAMS Research Institute',
    description: "A deep dive into Alkebulan — Africa's ancient name and identity — as the foundation for a 100-year continental renaissance plan. Covers cultural, economic, and political sovereignty.",
    category: 'History & Identity',
    tags: ['Alkebulan', 'Africa', '100-year plan', 'identity', 'sovereignty'],
    seriesNumber: 5,
  },
  'africas-balance-sheet-ubuntu-corridors': {
    title: "Africa's Balance Sheet: Ubuntu Corridors",
    author: 'CAMS Research Institute',
    description: "A financial accounting of Africa's true wealth using Ubuntu mathematics. Maps trade corridors, resource flows, and value chains across the continent with sovereign balance sheet analysis.",
    category: 'Finance & Economics',
    tags: ['balance sheet', 'Ubuntu corridors', 'trade', 'Africa', 'economics'],
    seriesNumber: 6,
  },
  'africas-bio-mimetics-arsenal': {
    title: "Africa's Bio-Mimetics Arsenal",
    author: 'CAMS Research Institute',
    description: "Explores Africa's biological and ecological systems as models for industrial innovation. Covers bio-mimetic engineering, sustainable manufacturing, and nature-inspired technology development.",
    category: 'Science & Technology',
    tags: ['bio-mimetics', 'innovation', 'Africa', 'technology', 'sustainability'],
    seriesNumber: 7,
  },
  'decoupling-from-colonialism': {
    title: 'Decoupling from Colonialism',
    author: 'CAMS Research Institute',
    description: 'A practical roadmap for African nations to systematically decouple from colonial economic, political, and cultural systems. Covers monetary sovereignty, trade independence, and institutional rebuilding.',
    category: 'Politics & Sovereignty',
    tags: ['decolonisation', 'sovereignty', 'Africa', 'independence', 'economics'],
    seriesNumber: 8,
  },
  'return-to-sender': {
    title: 'Return to Sender',
    author: 'CAMS Research Institute',
    description: "A bold analysis of how Africa can reverse the flow of extracted wealth back to its source. Covers reparations mathematics, resource repatriation, and sovereign debt restructuring.",
    category: 'Economics & Justice',
    tags: ['reparations', 'repatriation', 'Africa', 'sovereignty', 'justice'],
    seriesNumber: 9,
  },
  'south-africa-the-great-deception': {
    title: 'South Africa: The Great Deception',
    author: 'CAMS Research Institute',
    description: "An unflinching examination of the political and economic deceptions that have shaped post-apartheid South Africa. Covers the ANC transition, mineral wealth capture, and the Ubuntu alternative.",
    category: 'Politics & History',
    tags: ['South Africa', 'deception', 'apartheid', 'politics', 'sovereignty'],
    seriesNumber: 10,
  },
  'south-africa-the-great-renaissance': {
    title: 'South Africa: The Great Renaissance',
    author: 'CAMS Research Institute',
    description: "A vision for South Africa's economic and cultural renaissance through Ubuntu mathematics and sovereign resource management. Covers mineral wealth redistribution and community-led development.",
    category: 'Development & Planning',
    tags: ['South Africa', 'renaissance', 'Ubuntu', 'development', 'sovereignty'],
    seriesNumber: 11,
  },
  'south-africa-the-great-trek-reloaded': {
    title: 'South Africa: The Great Trek Reloaded',
    author: 'CAMS Research Institute',
    description: "A reinterpretation of South Africa's Great Trek through the lens of Ubuntu sovereignty. Explores land rights, migration patterns, and the mathematics of territorial sovereignty.",
    category: 'History & Identity',
    tags: ['South Africa', 'Great Trek', 'land rights', 'history', 'sovereignty'],
    seriesNumber: 12,
  },
  'the-girth-of-the-ledger-an-architects-guide-to-reclaiming-sovereign-mineral-wealth': {
    title: "The Girth of the Ledger: An Architect's Guide to Reclaiming Sovereign Mineral Wealth",
    author: 'CAMS Research Institute',
    description: "A technical architect's guide to building sovereign mineral wealth management systems. Covers ledger mathematics, resource accounting, and the Ubuntu value formula applied to mineral extraction.",
    category: 'Finance & Resources',
    tags: ['mineral wealth', 'sovereign ledger', 'architecture', 'Africa', 'resources'],
    seriesNumber: 13,
  },
  'the-sovereign-engine-cake-chain-mapping-for-the-african-renaissance': {
    title: 'The Sovereign Engine: Cake Chain Mapping for the African Renaissance',
    author: 'CAMS Research Institute',
    description: "The definitive guide to Cake Chain Mapping — CAMS' proprietary framework for tracking value multiplication from raw resources to finished goods. Essential reading for African economic planners.",
    category: 'Economics & Strategy',
    tags: ['cake chain', 'sovereign engine', 'value mapping', 'Africa', 'renaissance'],
    seriesNumber: 14,
  },
  'the-ubuntu-oceans-policy-blue-economy-reimagined': {
    title: 'The Ubuntu Oceans Policy: Blue Economy Reimagined',
    author: 'CAMS Research Institute',
    description: "A revolutionary framework for managing Africa's ocean resources through Ubuntu mathematics. Covers blue economy sovereignty, maritime trade corridors, and sustainable fishing mathematics.",
    category: 'Policy & Environment',
    tags: ['blue economy', 'oceans', 'Ubuntu', 'maritime', 'Africa'],
    seriesNumber: 15,
  },
  'ubuntu-maths-the-sovereign-calculus': {
    title: 'Ubuntu Maths: The Sovereign Calculus',
    author: 'CAMS Research Institute',
    description: "The foundational textbook of Ubuntu Mathematics. Covers the complete sovereign calculus framework — from basic Ubuntu value formulas to advanced communal wealth distribution models.",
    category: 'Mathematics & Education',
    tags: ['Ubuntu maths', 'sovereign calculus', 'mathematics', 'education', 'Africa'],
    seriesNumber: 16,
  },
};

// ── EPUB chapter extractor ────────────────────────────────────────────────────

function extractEpubChapters(filePath, maxChapters = 3) {
  try {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();

    // Find HTML/XHTML content files
    const contentFiles = entries
      .filter(e => {
        const name = e.entryName.toLowerCase();
        return (name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm'));
      })
      .map(e => {
        // Extract numeric prefix for proper sorting (e.g. "OEBPS/10_chapter.xhtml" → 10)
        const match = e.entryName.match(/\/(\d+)_/);
        return { entry: e, num: match ? parseInt(match[1]) : 999 };
      })
      .sort((a, b) => a.num - b.num)
      .map(x => x.entry);

    if (contentFiles.length === 0) return null;

    // Skip front matter: cover (0), title-page (1), reedsy/publisher pages (2,3)
    // Front matter files typically contain: cover, title-page, reedsy, copyright, dedication
    const FRONT_MATTER_KEYWORDS = ['cover', 'title', 'reedsy', 'copyright', 'dedication', 'epigraph', 'halftitle', 'frontmatter'];
    
    const chapterFiles = contentFiles.filter(e => {
      const name = e.entryName.toLowerCase();
      return !FRONT_MATTER_KEYWORDS.some(kw => name.includes(kw));
    }).slice(0, maxChapters);

    // If no chapters found after filtering, just take files 4-7 (skip first 3 front matter)
    const filesToUse = chapterFiles.length >= 1 ? chapterFiles : contentFiles.slice(3, 3 + maxChapters);

    let combinedText = '';
    let chaptersExtracted = 0;

    for (const entry of filesToUse) {
      try {
        const content = entry.getData().toString('utf8');
        // Strip HTML tags, keep text
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

        if (text.length > 50) { // skip near-empty files
          combinedText += `\n\n--- Chapter ${chaptersExtracted + 1} ---\n\n${text}`;
          chaptersExtracted++;
        }
      } catch (e) {
        // skip unreadable entry
      }
    }

    return combinedText.length > 100 ? combinedText.slice(0, 80000) : null;
  } catch (e) {
    console.log(`  ⚠️  Could not extract chapters: ${e.message}`);
    return null;
  }
}

// ── Upload file to Cloudinary ─────────────────────────────────────────────────

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

// ── Upload text content as a text file ───────────────────────────────────────

function uploadTextToCloudinary(text, folder, publicId) {
  return new Promise((resolve, reject) => {
    const { Readable } = require('stream');
    const buffer = Buffer.from(text, 'utf8');
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'raw', overwrite: true },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// ── Mongoose model (inline, no new collection) ───────────────────────────────

const PlatformContentSchema = new mongoose.Schema(
  { contentType: { type: String, required: true, index: true } },
  { timestamps: true, collection: 'analyticsevents', strict: false }
);

const PlatformContent = mongoose.models.PlatformContent ||
  mongoose.model('PlatformContent', PlatformContentSchema);

// ── Main batch upload ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 CAMS Books Batch Upload');
  console.log('='.repeat(50));

  // Validate Cloudinary config
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('\n❌ Missing Cloudinary credentials!');
    console.error('Add to your .env file:');
    console.error('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('  CLOUDINARY_API_KEY=your_api_key');
    console.error('  CLOUDINARY_API_SECRET=your_api_secret');
    process.exit(1);
  }

  // Connect to MongoDB
  console.log('\n📡 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Get all EPUB files
  const files = fs.readdirSync(BOOKS_DIR)
    .filter(f => f.endsWith('.epub'))
    .sort();

  console.log(`\n📚 Found ${files.length} EPUB files\n`);

  const results = { success: [], failed: [], skipped: [] };

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const slug = filename.replace('.epub', '');
    const filePath = path.join(BOOKS_DIR, filename);
    const meta = BOOK_CATALOG[slug];

    console.log(`\n[${i + 1}/${files.length}] ${filename}`);

    if (!meta) {
      console.log(`  ⚠️  No metadata found for slug: ${slug}`);
      results.skipped.push(filename);
      continue;
    }

    console.log(`  📖 Title: ${meta.title}`);

    try {
      // Check if already uploaded
      const existing = await PlatformContent.findOne({ contentType: 'book', slug });
      if (existing && existing.fullFileUrl) {
        console.log(`  ✅ Already uploaded — skipping`);
        results.skipped.push(filename);
        continue;
      }

      // 1. Upload full EPUB
      console.log(`  ⬆️  Uploading full EPUB...`);
      const publicId = `cams/ebooks/${slug}`;
      const uploadResult = await uploadToCloudinary(filePath, 'cams/ebooks', slug);
      const fullFileUrl = uploadResult.secure_url;
      console.log(`  ✅ Full EPUB: ${fullFileUrl}`);

      // 2. Extract chapters 1-3 as sample
      console.log(`  📄 Extracting chapters 1-3...`);
      const sampleText = extractEpubChapters(filePath, 3);
      let sampleChapterUrl = '';

      if (sampleText && sampleText.length > 100) {
        const samplePublicId = `${slug}-sample-chapters`;
        const sampleResult = await uploadTextToCloudinary(
          `SAMPLE PREVIEW — Chapters 1-3\n${'='.repeat(40)}\n\n${sampleText}`,
          'cams/samples',
          samplePublicId
        );
        sampleChapterUrl = sampleResult.secure_url;
        console.log(`  ✅ Sample chapters: ${sampleChapterUrl}`);
      } else {
        console.log(`  ⚠️  Could not extract chapters — using full file as sample`);
        sampleChapterUrl = fullFileUrl;
      }

      // 3. Upsert book record in database
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

      await PlatformContent.findOneAndUpdate(
        { contentType: 'book', slug },
        bookData,
        { upsert: true, new: true }
      );

      console.log(`  ✅ Database record saved`);
      results.success.push(meta.title);

    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      results.failed.push({ file: filename, error: err.message });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  console.log('📊 BATCH UPLOAD COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Uploaded:  ${results.success.length}`);
  console.log(`⏭️  Skipped:   ${results.skipped.length}`);
  console.log(`❌ Failed:    ${results.failed.length}`);

  if (results.success.length > 0) {
    console.log('\n✅ Successfully uploaded:');
    results.success.forEach(t => console.log(`   • ${t}`));
  }

  if (results.failed.length > 0) {
    console.log('\n❌ Failed:');
    results.failed.forEach(f => console.log(`   • ${f.file}: ${f.error}`));
  }

  await mongoose.disconnect();
  console.log('\n✅ Done. Disconnected from MongoDB.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
