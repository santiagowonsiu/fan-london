import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  await dbConnect();
  try {
    console.log('Fetching organizations directly from collection...');
    const db = mongoose.connection.db;
    const organizations = await db.collection('organizations').find({ active: true }).sort({ name: 1 }).toArray();
    console.log('Found organizations:', organizations.length);
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

