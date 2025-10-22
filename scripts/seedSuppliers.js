import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supplierSchema = new mongoose.Schema({
  name: String,
  email: String,
  contactNumber: String,
  orderNotes: String,
  productTypes: [mongoose.Schema.Types.ObjectId],
  supplierType: String,
}, { timestamps: true, strict: false });

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

const initialSuppliers = [
  {
    name: 'Imports Sol Andino UK',
    supplierType: 'order',
  },
  {
    name: 'Jfc Uk Limited',
    supplierType: 'order',
  },
  {
    name: 'Liberty Wines',
    supplierType: 'order',
  },
  {
    name: 'Oui Chef Fruit and Produce Ltd',
    supplierType: 'order',
  },
  {
    name: 'T&S Enterprises (London) LTD',
    supplierType: 'order',
  },
  {
    name: 'Tazaki Foods Limited',
    supplierType: 'order',
  },
  {
    name: 'Amathus (Notting Hill)',
    supplierType: 'order',
  },
];

async function seedSuppliers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'inventory',
    });
    console.log('✅ Connected to MongoDB\n');

    for (const supplier of initialSuppliers) {
      const exists = await Supplier.findOne({ name: supplier.name });
      if (exists) {
        console.log(`⏭️  ${supplier.name} already exists`);
        continue;
      }

      await Supplier.create(supplier);
      console.log(`✅ Created: ${supplier.name} (${supplier.supplierType})`);
    }

    console.log(`\n✅ Seed complete! ${initialSuppliers.length} suppliers processed.`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedSuppliers();

