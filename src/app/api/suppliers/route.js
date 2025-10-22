import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Supplier } from '@/lib/models/Supplier';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { contactNumber: { $regex: q, $options: 'i' } },
    ];
  }

  const suppliers = await Supplier.find(filter)
    .populate('productTypes', 'name')
    .sort({ name: 1 });

  return NextResponse.json({ suppliers });
}

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { name, email, contactNumber, orderNotes, productTypes } = body;

  try {
    const supplier = await Supplier.create({
      name,
      email,
      contactNumber,
      orderNotes,
      productTypes: productTypes || [],
    });

    const populated = await Supplier.findById(supplier._id).populate('productTypes', 'name');
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

