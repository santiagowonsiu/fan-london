import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const itemSchema = new mongoose.Schema({
  type: String,
  typeId: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  archived: Boolean,
  baseContentValue: Number,
  baseContentUnit: String,
  purchasePackQuantity: Number,
  purchasePackUnit: String,
  imageUrl: String,
}, { timestamps: true });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

function isAllCaps(str) {
  // Check if string is all uppercase (ignoring numbers, spaces, and special chars)
  const letters = str.replace(/[^a-zA-Z]/g, '');
  return letters === letters.toUpperCase() && letters.length > 0;
}

async function removeDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'inventory',
    });
    console.log('✅ Connected to MongoDB\n');

    // Find duplicates based on normalized name (case-insensitive)
    const pipeline = [
      {
        $addFields: {
          normalizedName: { $toLower: '$name' }
        }
      },
      {
        $group: {
          _id: '$normalizedName',
          count: { $sum: 1 },
          items: { $push: { id: '$_id', name: '$name', createdAt: '$createdAt', archived: '$archived' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const duplicates = await Item.aggregate(pipeline);

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    console.log(`Found ${duplicates.length} sets of duplicates\n`);

    let totalRemoved = 0;

    for (const dup of duplicates) {
      // Separate items into all-caps and title case
      const titleCaseItems = dup.items.filter(item => !isAllCaps(item.name));
      const allCapsItems = dup.items.filter(item => isAllCaps(item.name));

      let toKeep;
      let toDelete = [];

      if (titleCaseItems.length > 0) {
        // Prefer title case items, keep the newest one
        titleCaseItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        toKeep = titleCaseItems[0];
        // Delete other title case duplicates + all caps versions
        toDelete = [...titleCaseItems.slice(1), ...allCapsItems];
      } else {
        // Only all-caps exist, keep the newest
        allCapsItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        toKeep = allCapsItems[0];
        toDelete = allCapsItems.slice(1);
      }

      console.log(`Processing "${dup._id}":`);
      console.log(`  ✅ Keeping: "${toKeep.name}" (ID: ${toKeep.id})`);
      
      for (const item of toDelete) {
        const reason = isAllCaps(item.name) ? 'ALL CAPS' : 'duplicate';
        console.log(`  ❌ Deleting: "${item.name}" (${reason}, ID: ${item.id})`);
        await Item.findByIdAndDelete(item.id);
        totalRemoved++;
      }
      console.log('');
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Total duplicate sets processed: ${duplicates.length}`);
    console.log(`   Total items removed: ${totalRemoved}`);
    console.log(`   Items kept: ${duplicates.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

removeDuplicates();
