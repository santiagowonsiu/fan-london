require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const orgs = await mongoose.connection.db.collection('organizations').find({}).toArray();
  console.log('Organizations in DB:', JSON.stringify(orgs, null, 2));
  await mongoose.connection.close();
}

check().catch(console.error);
