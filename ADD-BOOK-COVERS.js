/**
 * Add Book Cover Images
 * =====================
 * Adds cover images to all books in the database.
 * Uses category-based placeholder images from a public CDN.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

// Category-based cover image mapping
const CATEGORY_COVERS = {
  'Strategy & Sovereignty': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop&q=80',
  'Finance & Economics': 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=600&fit=crop&q=80',
  'Development & Planning': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=600&fit=crop&q=80',
  'Economics & Resources': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=600&fit=crop&q=80',
  'History & Identity': 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop&q=80',
  'Science & Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop&q=80',
  'Politics & Sovereignty': 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=600&fit=crop&q=80',
  'Economics & Justice': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=600&fit=crop&q=80',
  'Politics & History': 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=400&h=600&fit=crop&q=80',
  'Finance & Resources': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=600&fit=crop&q=80',
  'Economics & Strategy': 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop&q=80',
  'Policy & Environment': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=600&fit=crop&q=80',
  'Mathematics & Education': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop&q=80',
};

// Default fallback cover
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop&q=80';

async function main() {
  console.log('\n📸 Adding Book Cover Images');
  console.log('='.repeat(50));

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const PlatformContent = mongoose.model('PlatformContent', new mongoose.Schema(
    { contentType: { type: String, required: true } },
    { timestamps: true, collection: 'analyticsevents', strict: false }
  ));

  // Find all books
  const books = await PlatformContent.find({ contentType: 'book' });
  console.log(`📚 Found ${books.length} books\n`);

  let updated = 0;
  let skipped = 0;

  for (const book of books) {
    if (book.coverUrl && book.coverUrl.length > 0) {
      console.log(`⏭️  ${book.title}: Already has cover`);
      skipped++;
      continue;
    }

    // Get cover URL based on category
    const coverUrl = CATEGORY_COVERS[book.category] || DEFAULT_COVER;

    await PlatformContent.updateOne(
      { _id: book._id },
      { $set: { coverUrl } }
    );

    console.log(`✅ ${book.title}`);
    console.log(`   Category: ${book.category}`);
    console.log(`   Cover: ${coverUrl.substring(0, 60)}...`);
    updated++;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📚 Total:   ${books.length}`);

  await mongoose.disconnect();
  console.log('\n✅ Done!\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
