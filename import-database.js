require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function importDatabase() {
  try {
    // Read the new MongoDB URI from command line argument
    const newMongoUri = process.argv[2];
    
    if (!newMongoUri) {
      console.error('❌ Usage: node import-database.js "mongodb+srv://..."');
      process.exit(1);
    }
    
    await mongoose.connect(newMongoUri);
    console.log('Connected to NEW MongoDB\n');
    
    const db = mongoose.connection.db;
    const exportData = JSON.parse(fs.readFileSync('database-export.json', 'utf8'));
    
    for (const [collectionName, documents] of Object.entries(exportData)) {
      if (documents.length === 0) {
        console.log(`⊘ Skipping empty collection: ${collectionName}`);
        continue;
      }
      
      // Create collection and insert documents
      await db.collection(collectionName).insertMany(documents);
      console.log(`✓ Imported ${collectionName}: ${documents.length} documents`);
    }
    
    console.log('\n✅ Database imported successfully!');
    console.log('\n⚠️  NEXT STEPS:');
    console.log('1. Update MONGODB_URI in .env file with the new connection string');
    console.log('2. Update MONGODB_URI in Render dashboard environment variables');
    console.log('3. Restart the backend server');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

importDatabase();
