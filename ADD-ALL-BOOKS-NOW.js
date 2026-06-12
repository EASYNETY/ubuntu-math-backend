/**
 * ADD ALL 15 BOOKS TO YOUR ACCOUNT NOW
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function addAllBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const UserSchema = new mongoose.Schema({
      email: String,
      name: String,
      purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId }]
    }, { collection: 'users' });

    const BookSchema = new mongoose.Schema({
      title: String,
      author: String
    }, { collection: 'platformcontents' });

    const User = mongoose.model('User', UserSchema);
    const Book = mongoose.model('Book', BookSchema);

    // Your user ID
    const userId = '6a288a11bfb79aaf06e54617';
    
    // Get ALL books
    const allBooks = await Book.find({});
    console.log(`Found ${allBooks.length} books in database\n`);
    
    if (allBooks.length === 0) {
      console.log('❌ No books in database!');
      console.log('   You need to upload books first: node batch-upload-books.js');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Show book titles
    console.log('Books to add:');
    allBooks.forEach((b, i) => {
      console.log(`${i + 1}. ${b.title}`);
    });
    console.log('');

    // Add ALL books to user
    const bookIds = allBooks.map(b => b._id);
    
    await User.findByIdAndUpdate(userId, {
      $set: { purchasedBooks: bookIds }
    });
    
    console.log(`✓ Added ${bookIds.length} books to your account!\n`);
    
    // Verify
    const user = await User.findById(userId);
    console.log(`✓ Verified: Your account now has ${user.purchasedBooks.length} books\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('NOW:');
    console.log('1. Refresh your browser (F5)');
    console.log('2. Go to /my-library');
    console.log('3. You will see all books!');
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addAllBooks();
