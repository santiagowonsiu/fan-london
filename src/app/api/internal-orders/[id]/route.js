import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { InternalOrder } from '@/lib/models/InternalOrder';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();

  try {
    const order = await InternalOrder.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // If updating item statuses, log activity for items that changed
    if (body.items) {
      // Process each item
      const processedItems = [];
      
      for (let i = 0; i < body.items.length; i++) {
        const newItem = body.items[i];
        const oldItem = order.items[i];
        const newItemStatus = newItem.status || 'pending';
        
        // Build the complete item object
        const processedItem = {
          itemId: newItem.itemId,
          quantity: newItem.quantity,
          quantityBase: newItem.quantityBase,
          quantityPack: newItem.quantityPack,
          unitUsed: newItem.unitUsed,
          hasStock: newItem.hasStock,
          needsToBuy: newItem.needsToBuy,
          status: newItemStatus,
          statusChangedAt: oldItem?.statusChangedAt,
          previousStatus: oldItem?.previousStatus,
          _id: newItem._id
        };
        
        // Only log if status changed AND it's not the first change from pending
        if (oldItem && newItemStatus !== (oldItem.status || 'pending') && oldItem.statusChangedAt) {
          await ActivityLog.create({
            action: 'internal_order_item_status_changed',
            entityType: 'internal_order',
            entityId: id,
            entityName: oldItem.itemId?.name || 'Unknown Item',
            details: {
              orderGroup: order.orderGroup,
              department: order.department,
              itemIndex: i,
              previousStatus: oldItem.status || 'pending',
              newStatus: newItemStatus
            }
          });
        }

        // Mark when status first changed from pending
        if (newItemStatus !== 'pending' && !oldItem?.statusChangedAt) {
          processedItem.statusChangedAt = new Date();
          processedItem.previousStatus = 'pending';
        }
        
        processedItems.push(processedItem);
      }

      // Auto-calculate overall status based on item statuses
      const allPurchased = processedItems.every(item => item.status === 'purchased');
      const allRejected = processedItems.every(item => item.status === 'rejected');
      const anyPending = processedItems.some(item => (item.status || 'pending') === 'pending');
      
      let overallStatus;
      if (allPurchased) {
        overallStatus = 'completed';
      } else if (allRejected) {
        overallStatus = 'rejected';
      } else if (anyPending) {
        overallStatus = 'pending';
      } else {
        overallStatus = 'completed'; // Mixed purchased/rejected = completed
      }

      // Update with processed items
      order.items = processedItems;
      order.overallStatus = overallStatus;
      if (body.notes !== undefined) order.notes = body.notes;
      if (body.orderGroup !== undefined) order.orderGroup = body.orderGroup;
      
      await order.save();
    } else {
      // Update other fields
      Object.keys(body).forEach(key => {
        order[key] = body[key];
      });
      await order.save();
    }

    // Re-fetch with populated data
    const updated = await InternalOrder.findById(id)
      .populate('items.itemId', 'name type baseContentUnit purchasePackUnit');
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  
  await InternalOrder.findByIdAndDelete(id);
  return new NextResponse(null, { status: 204 });
}
