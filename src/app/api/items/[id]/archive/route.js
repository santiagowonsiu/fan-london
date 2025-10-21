import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';

export async function POST(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  
  try {
    const item = await Item.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    item.archived = !item.archived;
    await item.save();
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

