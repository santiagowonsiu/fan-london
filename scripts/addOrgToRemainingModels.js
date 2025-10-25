/**
 * Script to add organizationId to remaining models that don't have it yet
 * Run this script to complete the multi-organization setup
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function addOrgToRemainingModels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const testOrgId = new mongoose.Types.ObjectId('68fcdad063522a9c2c9b990f');

    // Collections that still need organizationId
    const collections = [
      'externalorders',
      'directpurchases',
      'personalexpenses',
      'suppliers',
      'stockreconciliations'
    ];

    for (const collectionName of collections) {
      const result = await mongoose.connection.db.collection(collectionName).updateMany(
        { organizationId: { $exists: false } },
        { $set: { organizationId: testOrgId } }
      );
      console.log(`  ${collectionName}: Migrated ${result.modifiedCount} documents`);
    }

    console.log('\n✅ All remaining collections updated!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addOrgToRemainingModels();

