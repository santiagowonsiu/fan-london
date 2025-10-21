import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();
  const { type, name, archived, baseContentValue, baseContentUnit, purchasePackQuantity, purchasePackUnit, imageUrl } = body;

  try {
    const oldItem = await Item.findById(id);
    if (!oldItem) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const item = await Item.findByIdAndUpdate(
      id,
      { type, name, archived, baseContentValue, baseContentUnit, purchasePackQuantity, purchasePackUnit, imageUrl },
      { new: true, runValidators: true }
    );

    // Log the activity
    await ActivityLog.create({
      action: 'product_edited',
      entityType: 'product',
      entityId: id,
      entityName: item.name,
      details: {
        before: {
          type: oldItem.type,
          name: oldItem.name,
          archived: oldItem.archived,
          baseContentValue: oldItem.baseContentValue,
          baseContentUnit: oldItem.baseContentUnit,
          purchasePackQuantity: oldItem.purchasePackQuantity,
          purchasePackUnit: oldItem.purchasePackUnit
        },
        after: {
          type: item.type,
          name: item.name,
          archived: item.archived,
          baseContentValue: item.baseContentValue,
          baseContentUnit: item.baseContentUnit,
          purchasePackQuantity: item.purchasePackQuantity,
          purchasePackUnit: item.purchasePackUnit
        }
      }
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const justification = searchParams.get('justification');

  if (!justification || !justification.trim()) {
    return NextResponse.json({ error: 'Justification is required for deleting products' }, { status: 400 });
  }

  try {
    const item = await Item.findById(id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Log the activity before deleting
    await ActivityLog.create({
      action: 'product_deleted',
      entityType: 'product',
      entityId: id,
      entityName: item.name,
      details: {
        type: item.type,
        name: item.name,
        baseContentValue: item.baseContentValue,
        baseContentUnit: item.baseContentUnit,
        purchasePackQuantity: item.purchasePackQuantity,
        purchasePackUnit: item.purchasePackUnit
      },
      justification: justification.trim()
    });

    await Item.findByIdAndDelete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

