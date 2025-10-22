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
  purchasePackUnit: String,
  minStock: Number,
}, { timestamps: true, strict: false });

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

// Smart defaults based on item type and name patterns
function getSmartMinStock(item) {
  const name = item.name.toLowerCase();
  const type = item.type.toLowerCase();
  const unit = (item.purchasePackUnit || 'unit').toLowerCase();
  
  // Oils and sauces - frequently used
  if (name.includes('oil') || name.includes('sauce') || name.includes('vinegar')) {
    return unit.includes('bottle') ? 2 : 3;
  }
  
  // Spices and seasonings
  if (type.includes('spice') || name.includes('pepper') || name.includes('salt')) {
    return 2;
  }
  
  // Fresh produce - higher turnover
  if (type.includes('fresh') || type.includes('vegetable') || type.includes('fruit')) {
    return 5;
  }
  
  // Proteins - meat, fish
  if (type.includes('protein') || name.includes('chicken') || name.includes('beef') || name.includes('fish')) {
    return 3;
  }
  
  // Dairy products
  if (type.includes('dairy') || name.includes('milk') || name.includes('cream') || name.includes('cheese')) {
    return 2;
  }
  
  // Beverages
  if (type.includes('beverage') || name.includes('wine') || name.includes('beer') || name.includes('juice')) {
    return unit.includes('bottle') ? 6 : 12;
  }
  
  // Bar supplies
  if (type.includes('bar') || type.includes('liquor') || name.includes('vodka') || name.includes('gin')) {
    return 2;
  }
  
  // Disposables - high usage
  if (type.includes('disposable') || name.includes('napkin') || name.includes('bag') || name.includes('cup')) {
    return unit.includes('box') ? 5 : 10;
  }
  
  // Cleaning supplies
  if (type.includes('cleaning') || name.includes('soap') || name.includes('detergent')) {
    return 3;
  }
  
  // Default based on unit type
  if (unit.includes('box') || unit.includes('case')) return 3;
  if (unit.includes('bottle')) return 2;
  if (unit.includes('bag') || unit.includes('pack')) return 4;
  
  return 2; // Safe default for small restaurant
}

async function addMinStock() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'inventory',
    });
    console.log('✅ Connected to MongoDB\n');

    const items = await Item.find({});
    console.log(`Found ${items.length} items\n`);

    let updated = 0;
    for (const item of items) {
      const minStock = getSmartMinStock(item);
      
      await Item.updateOne(
        { _id: item._id },
        { $set: { minStock } }
      );
      
      console.log(`✅ ${item.name}: ${minStock} ${item.purchasePackUnit || 'units'}`);
      updated++;
    }

    console.log(`\n✅ Updated ${updated} items with smart min stock values!`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addMinStock();

