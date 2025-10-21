import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const internalOrderSchema = new mongoose.Schema({
  department: String,
  orderGroup: String,
  items: [mongoose.Schema.Types.Mixed],
  status: String,
  overallStatus: String,
  notes: String,
}, { timestamps: true, strict: false });

const InternalOrder = mongoose.models.InternalOrder || mongoose.model('InternalOrder', internalOrderSchema);

async function migrateOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'inventory',
    });
    console.log('✅ Connected to MongoDB\n');

    const orders = await InternalOrder.find({});
    console.log(`Found ${orders.length} internal orders\n`);

    for (const order of orders) {
      let updated = false;
      
      // Migrate old 'status' to 'overallStatus'
      if (order.status && !order.overallStatus) {
        order.overallStatus = order.status === 'pending' ? 'pending' : 'completed';
        updated = true;
        console.log(`Order ${order._id}: Added overallStatus = ${order.overallStatus}`);
      }

      // Add default department if missing
      if (!order.department) {
        order.department = 'Kitchen';
        updated = true;
        console.log(`Order ${order._id}: Added default department = Kitchen`);
      }

      // Migrate items to have individual status
      if (order.items && order.items.length > 0) {
        const oldStatus = order.status || 'pending';
        order.items = order.items.map(item => {
          if (!item.status) {
            item.status = oldStatus;
            updated = true;
            console.log(`  - Item ${item.itemId}: Added status = ${item.status}`);
          }
          return item;
        });
      }

      if (updated) {
        // Use update instead of save to avoid validation issues
        await InternalOrder.updateOne(
          { _id: order._id },
          { 
            $set: { 
              overallStatus: order.overallStatus,
              department: order.department,
              items: order.items
            }
          }
        );
        console.log(`✅ Updated order ${order._id}\n`);
      }
    }

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

migrateOrders();

