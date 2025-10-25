import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Organization } from '@/lib/models/Organization';

export async function GET() {
  await dbConnect();
  try {
    const organizations = await Organization.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

