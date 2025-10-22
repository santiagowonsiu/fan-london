import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Supplier } from '@/lib/models/Supplier';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();
  const { name, email, contactNumber, orderNotes, productTypes } = body;

  try {
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { name, email, contactNumber, orderNotes, productTypes },
      { new: true, runValidators: true }
    ).populate('productTypes', 'name');

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;

  try {
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

