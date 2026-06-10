require('dotenv').config();
const mongoose = require('mongoose');

async function cleanupCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`\nTotal collections: ${collections.length}/500`);
    console.log('\nChecking for empty collections...\n');
    
    let deletedCount = 0;
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      
      if (count === 0) {
        console.log(`Deleting empty collection: ${collectionName}`);
        await db.collection(collectionName).drop();
        deletedCount++;
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount} empty collections`);
    console.log(`Remaining: ${collections.length - deletedCount}/500`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupCollections();
