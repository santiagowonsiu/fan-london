import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { InternalOrder } from '@/lib/models/InternalOrder';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { department, orderGroup, items, notes } = body;

  if (!department) {
    return NextResponse.json({ error: 'Department is required' }, { status: 400 });
  }
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'At least one item required' }, { status: 400 });
  }

  try {
    const order = await InternalOrder.create({
      department,
      orderGroup,
      items,
      notes,
      overallStatus: 'pending'
    });
    
    const populated = await InternalOrder.findById(order._id)
      .populate('items.itemId', 'name type baseContentUnit purchasePackUnit');
    
    return NextResponse.json(populated, { status: 201 });
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

