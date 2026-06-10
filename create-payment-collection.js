require('dotenv').config();
const mongoose = require('mongoose');

async function createPaymentCollection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create the payments collection
    const db = mongoose.connection.db;
    await db.createCollection('payments');
    console.log('✅ Payments collection created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createPaymentCollection();
