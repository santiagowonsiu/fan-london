require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to:', mongoose.connection.db.databaseName);
  
  const db = mongoose.connection.db;
  const orgs = await db.collection('organizations').find({ active: true }).toArray();
  console.log('\nOrganizations found:', orgs.length);
  console.log(JSON.stringify(orgs, null, 2));
  
  await mongoose.connection.close();
}

test().catch(console.error);
