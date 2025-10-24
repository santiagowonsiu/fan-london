import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { DirectPurchase } from '@/lib/models/DirectPurchase';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();

  try {
    const purchase = await DirectPurchase.findByIdAndUpdate(id, body, { new: true });
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }
    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  
  await DirectPurchase.findByIdAndDelete(id);
  return new NextResponse(null, { status: 204 });
}
