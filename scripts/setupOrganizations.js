require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function setupOrganizations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const orgsCollection = db.collection('organizations');

    // Create the three organizations
    const organizations = [
      {
        name: 'Test Organization',
        slug: 'test',
        country: 'UK',
        currency: 'GBP',
        flagEmoji: '🧪',
        active: true,
        settings: { timezone: 'Europe/London', language: 'en' }
      },
      {
        name: 'FAN Notting Hill',
        slug: 'notting-hill',
        country: 'UK',
        currency: 'GBP',
        flagEmoji: '🇬🇧',
        active: true,
        settings: { timezone: 'Europe/London', language: 'en' }
      },
      {
        name: 'FAN Miraflores',
        slug: 'miraflores',
        country: 'Peru',
        currency: 'PEN',
        flagEmoji: '🇵🇪',
        active: true,
        settings: { timezone: 'America/Lima', language: 'es' }
      }
    ];

    console.log('Creating organizations...\n');
    
    const orgIds = {};
    for (const org of organizations) {
      const existing = await orgsCollection.findOne({ slug: org.slug });
      if (existing) {
        console.log(`  ✓ ${org.name} already exists (ID: ${existing._id})`);
        orgIds[org.slug] = existing._id;
      } else {
        const result = await orgsCollection.insertOne({
          ...org,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`  ✓ Created ${org.name} (ID: ${result.insertedId})`);
        orgIds[org.slug] = result.insertedId;
      }
    }

    console.log('\n✅ Organizations setup complete!');
    console.log('\nOrganization IDs:');
    console.log('  Test:', orgIds['test']);
    console.log('  Notting Hill:', orgIds['notting-hill']);
    console.log('  Miraflores:', orgIds['miraflores']);

    // Now migrate existing data
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('MIGRATING EXISTING DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Assign data based on your requirements
    const collections = [
      'items',
      'types',
      'transactions',
      'internalorders',
      'externalorders',
      'directpurchases',
      'personalexpenses',
      'suppliers',
      'stockreconciliations',
      'activitylogs'
    ];

    for (const collName of collections) {
      const collection = db.collection(collName);
      const count = await collection.countDocuments({ organizationId: { $exists: false } });
      
      if (count === 0) {
        console.log(`  ⊘ ${collName}: No documents to migrate`);
        continue;
      }

      console.log(`\n  📦 ${collName}: ${count} documents`);

      if (collName === 'items' || collName === 'types') {
        // Products and types go to BOTH Notting Hill and Test (will be cloned)
        // Miraflores starts clean but keeps types
        
        // First, get all existing data
        const existingDocs = await collection.find({ organizationId: { $exists: false } }).toArray();
        
        // Assign originals to Test
        await collection.updateMany(
          { organizationId: { $exists: false } },
          { $set: { organizationId: orgIds['test'] } }
        );
        console.log(`    ✓ Assigned ${count} to Test`);

        // Clone to Notting Hill
        const nottingHillDocs = existingDocs.map(doc => {
          const newDoc = { ...doc };
          delete newDoc._id;
          newDoc.organizationId = orgIds['notting-hill'];
          return newDoc;
        });
        if (nottingHillDocs.length > 0) {
          await collection.insertMany(nottingHillDocs);
          console.log(`    ✓ Cloned ${nottingHillDocs.length} to Notting Hill`);
        }

        // Clone types only to Miraflores
        if (collName === 'types') {
          const miraflorTypes = existingDocs.map(doc => {
            const newDoc = { ...doc };
            delete newDoc._id;
            newDoc.organizationId = orgIds['miraflores'];
            return newDoc;
          });
          if (miraflorTypes.length > 0) {
            await collection.insertMany(miraflorTypes);
            console.log(`    ✓ Cloned ${miraflorTypes.length} types to Miraflores`);
          }
        } else {
          console.log(`    ⊘ Miraflores starts with no products (clean)`);
        }

      } else if (collName === 'transactions' || collName === 'personalexpenses' || collName === 'directpurchases') {
        // Movements and expenses go to Test only (keep dummy data there)
        await collection.updateMany(
          { organizationId: { $exists: false } },
          { $set: { organizationId: orgIds['test'] } }
        );
        console.log(`    ✓ Assigned all ${count} to Test (dummy data)`);

      } else {
        // Everything else (suppliers, orders, etc.) goes to Test by default
        await collection.updateMany(
          { organizationId: { $exists: false } },
          { $set: { organizationId: orgIds['test'] } }
        );
        console.log(`    ✓ Assigned all ${count} to Test`);
      }
    }

    // Special handling for Users - they DON'T get organizationId (they're cross-org)
    // Only update the User model to track which orgs they have access to

    console.log('\n\n✅ Migration complete!');
    console.log('\nSummary:');
    console.log('  • Test: All original data (movements, expenses, products, types)');
    console.log('  • Notting Hill: Products and types cloned from Test');
    console.log('  • Miraflores: Types only, clean slate for products');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

setupOrganizations();

