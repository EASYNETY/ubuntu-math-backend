/**
 * Extract Full Book Content
 * ==========================
 * Extracts ALL chapters from EPUBs and uploads as text files for in-platform reading.
 * This allows paid users to read books directly on the platform without downloading.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const AdmZip = require('adm-zip');
const mongoose = require('mongoose');

const BOOKS_DIR = path.join(__dirname, '..', 'books');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

cloudinary.config({
  cloud_name: 'dqxse01f2',
  api_key: 324776629951427,
  api_secret: '08VyFSs_E9-YfqRr1JRtiu2FI0U',
  secure: true,
});

// ── Extract ALL chapters from EPUB ────────────────────────────────────────────

function extractAllEpubChapters(filePath) {
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
        const match = e.entryName.match(/\/(\d+)_/);
        return { entry: e, num: match ? parseInt(match[1]) : 999 };
      })
      .sort((a, b) => a.num - b.num)
      .map(x => x.entry);

    if (contentFiles.length === 0) return null;

    // Filter out front matter
    const FRONT_MATTER = ['cover', 'title', 'reedsy', 'copyright', 'dedication', 'epigraph', 'halftitle', 'frontmatter'];
    const chapterFiles = contentFiles.filter(e => {
      const name = e.entryName.toLowerCase();
      return !FRONT_MATTER.some(kw => name.includes(kw));
    });

    let combinedText = '';
    let chaptersExtracted = 0;

    for (const entry of chapterFiles) {
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
      } catch (e) {
        // skip unreadable entry
      }
    }

    console.log(`    Extracted ${chaptersExtracted} chapters`);
    return combinedText.length > 100 ? combinedText : null;
  } catch (e) {
    console.log(`    ⚠️  Error: ${e.message}`);
    return null;
  }
}

// ── Upload text to Cloudinary ─────────────────────────────────────────────────

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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📚 Extracting Full Book Content for In-Platform Reading');
  console.log('='.repeat(60));

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema(
    { contentType: { type: String, required: true } },
    { timestamps: true, collection: 'analyticsevents', strict: false }
  ));

  const books = await PlatformContent.find({ contentType: 'book' }).sort({ seriesNumber: 1 });
  console.log(`Found ${books.length} books in database\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const book of books) {
    console.log(`\n[${book.seriesNumber}/${books.length}] ${book.title}`);

    // Check if already has full content URL
    if (book.fullContentUrl && book.fullContentUrl.length > 0) {
      console.log('  ⏭️  Already has full content URL - skipping');
      skipped++;
      continue;
    }

    // Find EPUB file
    const epubFile = fs.readdirSync(BOOKS_DIR)
      .find(f => f.replace('.epub', '') === book.slug);

    if (!epubFile) {
      console.log('  ❌ EPUB file not found in books directory');
      failed++;
      continue;
    }

    const filePath = path.join(BOOKS_DIR, epubFile);

    try {
      // Extract ALL chapters
      console.log('  📄 Extracting all chapters...');
      const fullText = extractAllEpubChapters(filePath);

      if (!fullText) {
        console.log('  ❌ Failed to extract chapters');
        failed++;
        continue;
      }

      // Upload to Cloudinary
      console.log('  ⬆️  Uploading to Cloudinary...');
      const fullContentPublicId = `${book.slug}-full-content`;
      const uploadResult = await uploadTextToCloudinary(
        `FULL BOOK — All Chapters\n${'='.repeat(40)}\n\n${fullText}`,
        'cams/full-books',
        fullContentPublicId
      );

      // Update database
      await PlatformContent.updateOne(
        { _id: book._id },
        { $set: { fullContentUrl: uploadResult.secure_url } }
      );

      console.log(`  ✅ Full content uploaded`);
      console.log(`     URL: ${uploadResult.secure_url.substring(0, 60)}...`);
      updated++;

    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`📚 Total:   ${books.length}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
