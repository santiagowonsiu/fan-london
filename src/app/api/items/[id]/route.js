import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();
  const { type, name, archived, baseContentValue, baseContentUnit, purchasePackQuantity, purchasePackUnit, imageUrl } = body;

  try {
    const item = await Item.findByIdAndUpdate(
      id,
      { type, name, archived, baseContentValue, baseContentUnit, purchasePackQuantity, purchasePackUnit, imageUrl },
      { new: true, runValidators: true }
    );
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  await Item.findByIdAndDelete(id);
  return new NextResponse(null, { status: 204 });
}

