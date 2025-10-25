require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  
  // Check organizations
  const orgs = await db.collection('organizations').find({}).toArray();
  console.log('📋 Organizations:');
  orgs.forEach(org => {
    console.log(`  - ${org.name} (ID: ${org._id})`);
  });
  
  console.log('\n📊 Data distribution:');
  
  for (const org of orgs) {
    console.log(`\n${org.name}:`);
    const items = await db.collection('items').countDocuments({ organizationId: org._id });
    const types = await db.collection('types').countDocuments({ organizationId: org._id });
    const transactions = await db.collection('transactions').countDocuments({ organizationId: org._id });
    const internalOrders = await db.collection('internalorders').countDocuments({ organizationId: org._id });
    const externalOrders = await db.collection('externalorders').countDocuments({ organizationId: org._id });
    const expenses = await db.collection('personalexpenses').countDocuments({ organizationId: org._id });
    
    console.log(`  Items: ${items}`);
    console.log(`  Types: ${types}`);
    console.log(`  Transactions: ${transactions}`);
    console.log(`  Internal Orders: ${internalOrders}`);
    console.log(`  External Orders: ${externalOrders}`);
    console.log(`  Personal Expenses: ${expenses}`);
  }
  
  // Check for items without organizationId
  const orphans = await db.collection('items').countDocuments({ organizationId: { $exists: false } });
  console.log(`\n⚠️  Items without organizationId: ${orphans}`);
  
  await mongoose.connection.close();
}

check().catch(console.error);
