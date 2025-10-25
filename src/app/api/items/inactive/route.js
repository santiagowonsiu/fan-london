import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';
import { Transaction } from '@/lib/models/Transaction';

export async function GET() {
  await dbConnect();
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all non-archived items
    const allItems = await Item.find({ archived: false })
      .populate('typeId', 'name')
      .select('_id name typeId')
      .sort({ name: 1 });
    
    // Find items with no transactions in the last 30 days
    const inactiveItems = [];
    
    for (const item of allItems) {
      const recentTransaction = await Transaction.findOne({
        itemId: item._id,
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      if (!recentTransaction) {
        // Check if item has ANY transactions (to distinguish from brand new items)
        const anyTransaction = await Transaction.findOne({ itemId: item._id });
        
        if (anyTransaction) {
          // Get the last transaction date
          const lastTransaction = await Transaction.findOne({ itemId: item._id })
            .sort({ createdAt: -1 })
            .select('createdAt');
          
          inactiveItems.push({
            _id: item._id,
            name: item.name,
            type: item.typeId?.name || 'No Type',
            lastMovement: lastTransaction?.createdAt || null,
            daysSinceLastMovement: lastTransaction?.createdAt 
              ? Math.floor((Date.now() - new Date(lastTransaction.createdAt).getTime()) / (1000 * 60 * 60 * 24))
              : null
          });
        }
      }
    }
    
    return NextResponse.json(inactiveItems);
  } catch (error) {
    console.error('Error fetching inactive items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inactive items' },
      { status: 500 }
    );
  }
}

