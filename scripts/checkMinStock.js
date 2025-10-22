import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const itemSchema = new mongoose.Schema({
  type: String,
  name: String,
  minStock: Number,
}, { timestamps: true, strict: false });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

async function checkMinStock() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'inventory',
    });
    console.log('✅ Connected to MongoDB\n');

    // Check a few items to see their minStock values
    const items = await Item.find({}).limit(10);
    
    console.log('Sample items with minStock:\n');
    items.forEach(item => {
      console.log(`${item.name}: minStock = ${item.minStock}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkMinStock();

