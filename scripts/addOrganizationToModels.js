require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Import models after they're updated
const modelsToUpdate = [
  'Type',
  'Transaction',
  'InternalOrder',
  'ExternalOrder',
  'DirectPurchase',
  'PersonalExpense',
  'Supplier',
  'StockReconciliation',
  'ActivityLog'
];

async function addOrganizationField() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;

    for (const modelName of modelsToUpdate) {
      const collectionName = modelName.toLowerCase() + 's';
      const collection = db.collection(collectionName);
      
      // Check if collection exists
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        console.log(`⚠️  Collection ${collectionName} does not exist, skipping...`);
        continue;
      }

      console.log(`\nProcessing ${collectionName}...`);
      
      // Count documents without organizationId
      const count = await collection.countDocuments({ organizationId: { $exists: false } });
      console.log(`  Found ${count} documents without organizationId`);
    }

    console.log('\n✓ Analysis complete!');
    console.log('\nTo assign data to organizations, run the migration script next.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addOrganizationField();

