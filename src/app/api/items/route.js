import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const archived = searchParams.get('archived');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limitParam = searchParams.get('limit');
  const limit = limitParam === 'all' ? 'all' : parseInt(limitParam || '50');

  const filter = {};
  if (archived === 'true') filter.archived = true;
  if (archived === 'false') filter.archived = false;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { type: { $regex: q, $options: 'i' } },
    ];
  }

  const total = await Item.countDocuments(filter);
  const query = Item.find(filter).sort({ type: 1, name: 1 });
  
  if (limit !== 'all') {
    query.skip((page - 1) * limit).limit(limit);
  }
  
  const items = await query.exec();
  const pages = limit !== 'all' ? Math.max(Math.ceil(total / limit), 1) : 1;

  return NextResponse.json({
    items,
    total,
    page,
    pages,
    limit,
  });
}

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { type, name, archived, baseContentValue, baseContentUnit, purchasePackQuantity, purchasePackUnit, imageUrl } = body;
  
  try {
    const item = await Item.create({
      type,
      name,
      archived: !!archived,
      baseContentValue,
      baseContentUnit,
      purchasePackQuantity,
      purchasePackUnit,
      imageUrl,
    });

    // Log the activity
    await ActivityLog.create({
      action: 'product_added',
      entityType: 'product',
      entityId: item._id,
      entityName: item.name,
      details: {
        type: item.type,
        baseContentValue: item.baseContentValue,
        baseContentUnit: item.baseContentUnit,
        purchasePackQuantity: item.purchasePackQuantity,
        purchasePackUnit: item.purchasePackUnit
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

