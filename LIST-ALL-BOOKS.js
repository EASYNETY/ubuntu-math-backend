/**
 * LIST ALL BOOKS IN MONGODB
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function listAllBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Try different collection names
    const collections = ['platformcontents', 'books', 'platformcontent'];
    
    for (const collectionName of collections) {
      console.log(`\n━━━ Checking collection: ${collectionName} ━━━`);
      
      try {
        const BookSchema = new mongoose.Schema({}, { strict: false, collection: collectionName });
        const Book = mongoose.model(collectionName, BookSchema);
        
        const books = await Book.find({}).limit(20);
        console.log(`Found ${books.length} documents\n`);
        
        if (books.length > 0) {
          books.forEach((book, i) => {
            console.log(`${i + 1}. ID: ${book._id}`);
            console.log(`   Title: ${book.title || 'N/A'}`);
            console.log(`   Author: ${book.author || 'N/A'}`);
            console.log(`   Type: ${book.contentType || book.type || 'N/A'}`);
            console.log(`   Published: ${book.published || 'N/A'}`);
            console.log('');
          });
        }
      } catch (err) {
        console.log(`   Error: ${err.message}`);
      }
      
      mongoose.deleteModel(collectionName);
    }

    await mongoose.connection.close();
    console.log('✓ Done');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listAllBooks();
