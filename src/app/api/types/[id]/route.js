import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Type } from '@/lib/models/Type';
import { Item } from '@/lib/models/Item';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function PUT(request, { params }) {
  await dbConnect();
  const { id } = params;
  const body = await request.json();
  const { name } = body;
  
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Type name required' }, { status: 400 });
  }

  try {
    const oldType = await Type.findById(id);
    if (!oldType) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }

    const updatedType = await Type.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    // Log the change
    await ActivityLog.create({
      action: 'product_type_updated',
      entityType: 'product_type',
      entityId: id,
      entityName: updatedType.name,
      details: {
        previousName: oldType.name,
        newName: updatedType.name
      },
      justification: 'Product type name updated'
    });

    return NextResponse.json(updatedType);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  await dbConnect();
  const { id } = params;

  try {
    // Check if type is being used
    const productCount = await Item.countDocuments({ typeId: id });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete type. It is being used by ${productCount} product(s).` },
        { status: 400 }
      );
    }

    const type = await Type.findById(id);
    if (!type) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }

    await Type.findByIdAndDelete(id);

    // Log the deletion
    await ActivityLog.create({
      action: 'product_type_deleted',
      entityType: 'product_type',
      entityId: id,
      entityName: type.name,
      details: {
        deletedType: type.name
      },
      justification: 'Product type deleted'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

