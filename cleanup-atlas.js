/**
 * Run this script locally to clean up your Atlas database:
 *   node cleanup-atlas.js
 *
 * It will drop all collections EXCEPT the ones your app uses.
 */
const { MongoClient } = require('mongodb');

// ── Paste your MongoDB URI here ───────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';

// Collections to KEEP — everything else gets dropped
const KEEP = new Set([
  'users',
  'courses',
  'enrollments',
  'stories',
  'innovations',
  'mathmodules',
  'studentprogresses',
  'subscriptions',
  'certificates',
  'analyticsevents',
  'simulatorsessions',
  'platformcontents',
]);

async function cleanup() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');

    const db = client.db();
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name).sort();

    console.log(`\n📊 Total collections: ${names.length}`);
    console.log(`✅ Keeping: ${names.filter(n => KEEP.has(n)).join(', ')}`);

    const toDrop = names.filter(n => !KEEP.has(n));
    console.log(`\n🗑️  Dropping ${toDrop.length} collections:\n`);

    let dropped = 0;
    let failed = 0;

    for (const name of toDrop) {
      try {
        await db.dropCollection(name);
        console.log(`  ✅ Dropped: ${name}`);
        dropped++;
      } catch (e) {
        console.log(`  ❌ Failed: ${name} — ${e.message}`);
        failed++;
      }
    }

    console.log(`\n🎉 Done! Dropped ${dropped} collections. Failed: ${failed}`);
    console.log(`📊 Remaining collections: ${names.length - dropped}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
    console.log('✅ Disconnected');
  }
}

cleanup();
