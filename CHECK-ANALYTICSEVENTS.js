require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

async function main() {
  console.log('🔍 Checking analyticsevents collection...\n');
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const collection = db.collection('analyticsevents');

  // Count all documents
  const total = await collection.countDocuments();
  console.log(`📊 Total documents in analyticsevents: ${total}\n`);

  // Count by contentType
  const byType = await collection.aggregate([
    { $group: { _id: '$contentType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log('📈 Documents by contentType:');
  byType.forEach(t => {
    console.log(`   ${t._id || '(no contentType)'}: ${t.count}`);
  });

  // Find book documents
  console.log('\n━━━ BOOK DOCUMENTS ━━━\n');
  const books = await collection.find({ contentType: 'book' }).toArray();
  
  if (books.length === 0) {
    console.log('❌ No book documents found!\n');
  } else {
    console.log(`Found ${books.length} book documents:\n`);
    books.forEach((book, i) => {
      console.log(`${i + 1}. ID: ${book._id}`);
      console.log(`   Title: ${book.title || 'N/A'}`);
      console.log(`   Slug: ${book.slug || 'N/A'}`);
      console.log(`   Has fullFileUrl: ${book.fullFileUrl ? '✅ YES' : '❌ NO'}`);
      console.log(`   Has sampleChapterUrl: ${book.sampleChapterUrl ? '✅ YES' : '❌ NO'}`);
      console.log(`   Published: ${book.published ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
  }

  await mongoose.disconnect();
  console.log('✅ Done\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
