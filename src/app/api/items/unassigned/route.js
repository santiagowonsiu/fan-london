import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';

export async function GET() {
  await dbConnect();
  
  try {
    // Find all items where typeId is null or undefined, and not archived
    const unassignedItems = await Item.find({
      $or: [
        { typeId: null },
        { typeId: { $exists: false } }
      ],
      archived: false
    }).select('_id name').sort({ name: 1 });
    
    return NextResponse.json(unassignedItems);
  } catch (error) {
    console.error('Error fetching unassigned items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unassigned items' },
      { status: 500 }
    );
  }
}

