import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongodb';
import { Transaction } from '@/lib/models/Transaction';
import { Item } from '@/lib/models/Item';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { itemId, direction, quantity, quantityBase, quantityPack, unitUsed, observations, personName } = body;

  if (!itemId || !mongoose.isValidObjectId(itemId)) {
    return NextResponse.json({ error: 'Invalid itemId' }, { status: 400 });
  }
  if (!['in', 'out'].includes(direction)) {
    return NextResponse.json({ error: 'Invalid direction' }, { status: 400 });
  }
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    return NextResponse.json({ error: 'Quantity must be > 0' }, { status: 400 });
  }

  const item = await Item.findById(itemId).select('name');
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  try {
    const tx = await Transaction.create({ 
      itemId, 
      direction, 
      quantity: qty,
      quantityBase: quantityBase || qty,
      quantityPack: quantityPack || qty,
      unitUsed: unitUsed || 'pack',
      observations: observations || undefined,
      personName: personName || undefined
    });

    // Log the activity
    await ActivityLog.create({
      action: 'transaction_added',
      entityType: 'transaction',
      entityId: tx._id,
      entityName: item.name,
      details: {
        direction,
        quantity: qty,
        quantityBase,
        quantityPack,
        unitUsed,
        observations: observations || undefined,
        personName: personName || undefined
      }
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const itemId = searchParams.get('itemId');
  const direction = searchParams.get('direction');

  const filter = {};
  if (itemId && mongoose.isValidObjectId(itemId)) filter.itemId = itemId;
  if (direction && ['in', 'out'].includes(direction)) filter.direction = direction;

  const total = await Transaction.countDocuments(filter);
  const txs = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('itemId', 'name type baseContentUnit purchasePackUnit');

  const pages = Math.max(Math.ceil(total / limit), 1);

  return NextResponse.json({
    transactions: txs,
    total,
    page,
    pages,
    limit,
  });
}

