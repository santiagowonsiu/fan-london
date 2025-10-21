import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { InternalOrder } from '@/lib/models/InternalOrder';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { orderGroup, items, notes } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'At least one item required' }, { status: 400 });
  }

  try {
    const order = await InternalOrder.create({
      orderGroup,
      items,
      notes,
      status: 'pending'
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const groupBy = searchParams.get('groupBy'); // 'order' or 'item'

  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const orders = await InternalOrder.find(filter)
    .sort({ createdAt: -1 })
    .populate('items.itemId', 'name type baseContentUnit purchasePackUnit');

  return NextResponse.json({ orders });
}

