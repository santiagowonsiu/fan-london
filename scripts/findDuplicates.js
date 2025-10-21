import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from parent directory
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

async function findDuplicates() {
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
          items: { $push: { id: '$_id', name: '$name', archived: '$archived', createdAt: '$createdAt' } }
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

    console.log(`Found ${duplicates.length} sets of duplicates:\n`);

    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. "${dup._id}" (${dup.count} occurrences):`);
      dup.items.forEach(item => {
        console.log(`   - ID: ${item.id}`);
        console.log(`     Name: "${item.name}"`);
        console.log(`     Archived: ${item.archived}`);
        console.log(`     Created: ${item.createdAt}`);
      });
      console.log('');
    });

    console.log(`\nTotal duplicate sets: ${duplicates.length}`);
    console.log(`Total duplicate items to remove: ${duplicates.reduce((sum, d) => sum + (d.count - 1), 0)}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

findDuplicates();

