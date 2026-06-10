require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

async function exportDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const exportData = {};
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const data = await db.collection(collectionName).find({}).toArray();
      exportData[collectionName] = data;
      console.log(`✓ Exported ${collectionName}: ${data.length} documents`);
    }
    
    fs.writeFileSync('database-export.json', JSON.stringify(exportData, null, 2));
    console.log('\n✅ Database exported to database-export.json');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

exportDatabase();
