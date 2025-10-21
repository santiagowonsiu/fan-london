import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const transactionSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  direction: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true, min: 0 },
  quantityBase: { type: Number },
  quantityPack: { type: Number },
  unitUsed: { type: String },
  observations: { type: String },
  personName: { type: String },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

async function checkTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'inventory',
    });
    console.log('✅ Connected to MongoDB\n');

    const latest = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('itemId', 'name baseContentValue baseContentUnit purchasePackUnit');

    console.log('Latest 3 transactions:\n');
    
    latest.forEach((tx, idx) => {
      console.log(`${idx + 1}. Transaction ID: ${tx._id}`);
      console.log(`   Item: ${tx.itemId?.name || 'N/A'}`);
      console.log(`   Direction: ${tx.direction}`);
      console.log(`   Quantity (old): ${tx.quantity}`);
      console.log(`   Quantity Base: ${tx.quantityBase || 'NOT SET'}`);
      console.log(`   Quantity Pack: ${tx.quantityPack || 'NOT SET'}`);
      console.log(`   Unit Used: ${tx.unitUsed || 'NOT SET'}`);
      console.log(`   Person Name: ${tx.personName || 'NOT SET'}`);
      console.log(`   Observations: ${tx.observations || 'NOT SET'}`);
      console.log(`   Created: ${tx.createdAt}`);
      console.log(`   Product Base Content: ${tx.itemId?.baseContentValue || 'N/A'} ${tx.itemId?.baseContentUnit || ''}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkTransactions();

