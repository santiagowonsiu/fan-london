import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Type } from '@/lib/models/Type';
import { Item } from '@/lib/models/Item';

export async function GET() {
  await dbConnect();
  const types = await Type.find({}).sort({ name: 1 });
  
  // Get product count for each type
  const typesWithCount = await Promise.all(
    types.map(async (type) => {
      const productCount = await Item.countDocuments({ typeId: type._id, archived: false });
      return {
        ...type.toObject(),
        productCount
      };
    })
  );
  
  return NextResponse.json(typesWithCount);
}

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { name } = body;
  
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Type name required' }, { status: 400 });
  }

  try {
    const type = await Type.create({ name: name.trim() });
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

