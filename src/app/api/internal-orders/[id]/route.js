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
      for (let i = 0; i < body.items.length; i++) {
        const newItemStatus = body.items[i].status;
        const oldItem = order.items[i];
        
        // Only log if status changed AND it's not the first change from pending
        if (oldItem && newItemStatus !== oldItem.status && oldItem.statusChangedAt) {
          const itemDetails = await InternalOrder.findById(id).populate('items.itemId', 'name');
          const item = itemDetails.items[i];
          
          await ActivityLog.create({
            action: 'internal_order_item_status_changed',
            entityType: 'internal_order',
            entityId: id,
            entityName: item.itemId?.name || 'Unknown Item',
            details: {
              orderGroup: order.orderGroup,
              department: order.department,
              itemIndex: i,
              previousStatus: oldItem.status,
              newStatus: newItemStatus
            }
          });
        }

        // Mark when status first changed from pending
        if (newItemStatus !== 'pending' && !oldItem.statusChangedAt) {
          body.items[i].statusChangedAt = new Date();
          body.items[i].previousStatus = 'pending';
        }
      }

      // Auto-calculate overall status based on item statuses
      const allPurchased = body.items.every(item => item.status === 'purchased');
      const allRejected = body.items.every(item => item.status === 'rejected');
      const anyPending = body.items.some(item => item.status === 'pending');
      
      if (allPurchased) {
        body.overallStatus = 'completed';
      } else if (allRejected) {
        body.overallStatus = 'rejected';
      } else if (anyPending) {
        body.overallStatus = 'pending';
      } else {
        body.overallStatus = 'completed'; // Mixed purchased/rejected = completed
      }
    }

    const updated = await InternalOrder.findByIdAndUpdate(id, body, { new: true })
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
