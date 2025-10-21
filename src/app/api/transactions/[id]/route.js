import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongodb';
import { Transaction } from '@/lib/models/Transaction';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();
  const { itemId, direction, quantity, justification } = body;

  if (!justification || !justification.trim()) {
    return NextResponse.json({ error: 'Justification is required for editing transactions' }, { status: 400 });
  }

  try {
    const oldTx = await Transaction.findById(id).populate('itemId', 'name');
    if (!oldTx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updates = {};
    if (itemId && mongoose.isValidObjectId(itemId)) updates.itemId = itemId;
    if (direction && ['in', 'out'].includes(direction)) updates.direction = direction;
    if (quantity !== undefined) {
      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json({ error: 'Quantity must be > 0' }, { status: 400 });
      }
      updates.quantity = qty;
    }

    const updatedTx = await Transaction.findByIdAndUpdate(id, updates, { new: true }).populate('itemId', 'name');

    // Log the activity
    await ActivityLog.create({
      action: 'transaction_edited',
      entityType: 'transaction',
      entityId: id,
      entityName: oldTx.itemId?.name || 'Unknown Item',
      details: {
        before: {
          itemId: oldTx.itemId?._id,
          itemName: oldTx.itemId?.name,
          direction: oldTx.direction,
          quantity: oldTx.quantity
        },
        after: {
          itemId: updatedTx.itemId?._id,
          itemName: updatedTx.itemId?.name,
          direction: updatedTx.direction,
          quantity: updatedTx.quantity
        }
      },
      justification: justification.trim()
    });

    return NextResponse.json(updatedTx);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const justification = searchParams.get('justification');

  if (!justification || !justification.trim()) {
    return NextResponse.json({ error: 'Justification is required for deleting transactions' }, { status: 400 });
  }

  try {
    const tx = await Transaction.findById(id).populate('itemId', 'name');
    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Log the activity before deleting
    await ActivityLog.create({
      action: 'transaction_deleted',
      entityType: 'transaction',
      entityId: id,
      entityName: tx.itemId?.name || 'Unknown Item',
      details: {
        direction: tx.direction,
        quantity: tx.quantity,
        date: tx.createdAt
      },
      justification: justification.trim()
    });

    await Transaction.findByIdAndDelete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

