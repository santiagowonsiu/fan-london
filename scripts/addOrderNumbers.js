import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const internalOrderSchema = new mongoose.Schema({
  orderNumber: String,
  department: String,
  orderGroup: String,
  items: [mongoose.Schema.Types.Mixed],
  overallStatus: String,
  notes: String,
}, { timestamps: true, strict: false });

const InternalOrder = mongoose.models.InternalOrder || mongoose.model('InternalOrder', internalOrderSchema);

async function addOrderNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'inventory',
    });
    console.log('✅ Connected to MongoDB\n');

    const orders = await InternalOrder.find({ orderNumber: { $exists: false } }).sort({ createdAt: 1 });
    console.log(`Found ${orders.length} orders without order numbers\n`);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const date = new Date(order.createdAt).toISOString().split('T')[0].replace(/-/g, '');
      const orderNumber = `IO-${date}-${String(i + 1).padStart(3, '0')}`;
      
      await InternalOrder.updateOne(
        { _id: order._id },
        { $set: { orderNumber } }
      );
      
      console.log(`✅ Order ${order._id}: ${orderNumber}`);
    }

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addOrderNumbers();

