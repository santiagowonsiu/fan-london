require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');
  console.log(`Database: ${mongoose.connection.db.databaseName}\n`);

  const collections = await mongoose.connection.db.listCollections().toArray();
  
  console.log('📦 All collections:');
  for (const coll of collections) {
    const count = await mongoose.connection.db.collection(coll.name).countDocuments({});
    console.log(`  ${coll.name}: ${count} documents`);
  }
  
  await mongoose.connection.close();
}

check().catch(console.error);
