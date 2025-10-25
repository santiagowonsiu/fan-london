import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { StockReconciliation } from '@/lib/models/StockReconciliation';

export async function GET() {
  try {
    await dbConnect();
    
    const reconciliations = await StockReconciliation.find()
      .sort({ reconciliationDate: -1 })
      .limit(50);
    
    return NextResponse.json({ reconciliations });
    
  } catch (error) {
    console.error('Error fetching reconciliations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reconciliations' },
      { status: 500 }
    );
  }
}

