import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { ExternalOrder } from '@/lib/models/ExternalOrder';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { supplier, orderDate, items, notes } = body;

  if (!supplier || !supplier.trim()) {
    return NextResponse.json({ error: 'Supplier is required' }, { status: 400 });
  }
  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'At least one item required' }, { status: 400 });
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + (item.totalCost || 0), 0);

  try {
    const order = await ExternalOrder.create({
      supplier: supplier.trim(),
      orderDate: orderDate || new Date(),
      items,
      totalAmount,
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
  const supplier = searchParams.get('supplier');

  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (supplier) filter.supplier = supplier;

  const orders = await ExternalOrder.find(filter)
    .sort({ createdAt: -1 })
    .populate('items.itemId', 'name type baseContentUnit purchasePackUnit');

  return NextResponse.json({ orders });
}

