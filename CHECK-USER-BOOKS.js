/**
 * CHECK WHAT'S IN YOUR ACCOUNT
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function checkUserBooks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected\n');

    const UserSchema = new mongoose.Schema({
      email: String,
      name: String,
      purchasedBooks: [{ type: mongoose.Schema.Types.ObjectId }]
    }, { collection: 'users' });

    const User = mongoose.model('User', UserSchema);

    // Your user ID from the API calls
    const userId = '6a288a11bfb79aaf06e54617';
    
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found!');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('User:', user.name);
    console.log('Email:', user.email);
    console.log('Books in purchasedBooks array:', user.purchasedBooks?.length || 0);
    console.log('');
    
    if (user.purchasedBooks && user.purchasedBooks.length > 0) {
      console.log('Book IDs:', user.purchasedBooks);
    } else {
      console.log('❌ NO BOOKS IN ACCOUNT!');
      console.log('\nThis means the enrollment script failed.');
      console.log('Running fix now...\n');
      
      // Add books now
      const BookSchema = new mongoose.Schema({
        title: String
      }, { collection: 'platformcontents' });
      
      const Book = mongoose.model('Book', BookSchema);
      const allBooks = await Book.find({});
      
      console.log(`Found ${allBooks.length} books in database`);
      
      if (allBooks.length > 0) {
        const bookIds = allBooks.map(b => b._id);
        await User.findByIdAndUpdate(userId, {
          $set: { purchasedBooks: bookIds }
        });
        console.log(`✓ Added ${bookIds.length} books to your account!`);
        
        // Verify
        const updated = await User.findById(userId);
        console.log(`✓ Verified: ${updated.purchasedBooks.length} books now in account\n`);
        
        console.log('🎉 DONE! Now refresh your browser and check /my-library');
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUserBooks();
