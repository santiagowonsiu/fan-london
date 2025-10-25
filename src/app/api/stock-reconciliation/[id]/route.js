import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { StockReconciliation } from '@/lib/models/StockReconciliation';

export async function GET(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const { id } = params;
    
    const reconciliation = await StockReconciliation.findById(id);
    
    if (!reconciliation) {
      return NextResponse.json(
        { error: 'Reconciliation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ reconciliation });
    
  } catch (error) {
    console.error('Error fetching reconciliation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reconciliation' },
      { status: 500 }
    );
  }
}

