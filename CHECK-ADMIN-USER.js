require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://qosbot:qosbot@microsrv.j8ond.mongodb.net/jjgtr-ubuntu-math?retryWrites=true&w=majority';
const ADMIN_ID = '6995c03c27265360eed64b00';

async function main() {
  console.log('\n🔍 Checking Admin User...\n');
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // List all collections
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('📋 Collections in database:');
  collections.forEach(c => console.log(`   - ${c.name}`));
  console.log();

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
  
  // Count users
  const totalUsers = await User.countDocuments();
  console.log(`Total users in 'users' collection: ${totalUsers}\n`);
  
  // Find admin users
  const admins = await User.find({ role: 'admin' });
  console.log(`Admin users found: ${admins.length}`);
  admins.forEach(admin => {
    console.log(`   - ${admin.email} (ID: ${admin._id})`);
  });
  console.log();
  
  // Check if ID is valid ObjectId format
  console.log('Checking ID validity...');
  console.log('   ID:', ADMIN_ID);
  console.log('   Is valid ObjectId:', mongoose.Types.ObjectId.isValid(ADMIN_ID));
  
  // Try with ObjectId
  console.log('\nTrying with mongoose.Types.ObjectId...');
  try {
    const userWithObjectId = await User.findById(new mongoose.Types.ObjectId(ADMIN_ID));
    if (userWithObjectId) {
      console.log('✅ Found with ObjectId!');
      console.log('   Role:', userWithObjectId.role);
    } else {
      console.log('❌ Not found with ObjectId');
    }
  } catch (e) {
    console.log('❌ Error with ObjectId:', e.message);
  }
  
  // Find by ID (string)
  console.log(`\nLooking for user with ID (string): ${ADMIN_ID}`);
  const user = await User.findById(ADMIN_ID);
  
  if (!user) {
    console.log('❌ User NOT found by ID!\n');
    
    // Try finding by email
    console.log('Trying to find by email: admin@i2l.africa');
    const userByEmail = await User.findOne({ email: 'admin@i2l.africa' });
    
    if (userByEmail) {
      console.log('✅ Found user by email!');
      console.log('   ID:', userByEmail._id.toString());
      console.log('   ID type:', typeof userByEmail._id);
      console.log('   Email:', userByEmail.email);
      console.log('   Name:', userByEmail.name);
      console.log('   Role:', userByEmail.role);
      console.log('\n⚠️  Checking ID formats:');
      console.log('   JWT ID:', ADMIN_ID, '(type:', typeof ADMIN_ID, ')');
      console.log('   DB ID:', userByEmail._id.toString(), '(type: ObjectId)');
      console.log('   Match:', ADMIN_ID === userByEmail._id.toString());
    } else {
      console.log('❌ User not found by email either!');
    }
  } else {
    console.log('✅ User found!');
    console.log('   ID:', user._id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Created:', user.createdAt);
    
    if (user.role === 'admin') {
      console.log('\n✅ User has admin role!');
    } else {
      console.log(`\n❌ User role is "${user.role}", not "admin"!`);
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
