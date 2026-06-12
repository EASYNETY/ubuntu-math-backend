require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function main() {
  console.log('\n🧪 Testing Admin Middleware Logic...\n');
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Import the actual User model from backend
  const { default: User } = await import('./dist/models/User.js');
  
  const userId = '6995c03c27265360eed64b00';
  
  console.log(`Testing User.findById('${userId}')...`);
  const user = await User.findById(userId);
  
  if (!user) {
    console.log('❌ User NOT found with User.findById()!\n');
    
    // Try with email
    const userByEmail = await User.findOne({ email: 'admin@i2l.africa' });
    if (userByEmail) {
      console.log('✅ But user EXISTS when searched by email!');
      console.log('   Email:', userByEmail.email);
      console.log('   Role:', userByEmail.role);
      console.log('   ID from DB:', userByEmail._id.toString());
      console.log('   ID from JWT:', userId);
      console.log('   IDs match:', userByEmail._id.toString() === userId);
    }
  } else {
    console.log('✅ User found!');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    
    if (user.role !== 'admin') {
      console.log(`\n❌ Role check would FAIL: user.role="${user.role}" !== "admin"`);
    } else {
      console.log('\n✅ Role check would PASS: user has admin role');
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
