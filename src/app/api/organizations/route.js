import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export async function GET() {
  try {
    console.log('API: Starting...');
    
    // Connect directly without the dbConnect wrapper
    if (mongoose.connection.readyState === 0) {
      console.log('API: Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI, { bufferCommands: false });
      console.log('API: Connected!');
    }
    
    console.log('API: Database name:', mongoose.connection.db.databaseName);
    const db = mongoose.connection.db;
    
    console.log('API: Querying organizations...');
    const organizations = await db.collection('organizations').find({ active: true }).sort({ name: 1 }).toArray();
    console.log('API: Found:', organizations.length);
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('API ERROR:', error.message);
    console.error('API ERROR stack:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

