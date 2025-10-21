import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { InternalOrder } from '@/lib/models/InternalOrder';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();

  try {
    const order = await InternalOrder.findByIdAndUpdate(id, body, { new: true })
      .populate('items.itemId', 'name type baseContentUnit purchasePackUnit');
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
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

