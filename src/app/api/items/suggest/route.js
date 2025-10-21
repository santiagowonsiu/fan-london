import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  
  if (!q) {
    return NextResponse.json([]);
  }

  const items = await Item.find({ name: { $regex: q, $options: 'i' } })
    .select('name type archived baseContentValue baseContentUnit purchasePackQuantity purchasePackUnit')
    .limit(10)
    .sort({ name: 1 });

  return NextResponse.json(items);
}

