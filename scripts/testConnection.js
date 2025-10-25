const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function test() {
  console.log('Connecting with URI:', process.env.MONGODB_URI);
  
  // Connect WITHOUT specifying database
  await mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false,
  });
  
  console.log('Connected!');
  console.log('Database name:', mongoose.connection.db.databaseName);
  
  const orgs = await mongoose.connection.db.collection('organizations').find({}).toArray();
  console.log('Organizations found:', orgs.length);
  
  await mongoose.connection.close();
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
