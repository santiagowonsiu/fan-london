import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';

export async function GET() {
  try {
    await dbConnect();
    
    // Fetch all non-archived items with their types
    const items = await Item.find({ archived: false })
      .populate('typeId', 'name')
      .sort({ 'typeId.name': 1, name: 1 });
    
    // Create CSV header - Rearranged for better UX
    const csvHeaders = [
      'Type',
      'Item',
      'PACK STOCK (Count your packages/boxes here)',
      'Base Content (Reference)',
      'Pack Unit (Reference)',
      'BASE STOCK (OR count individual units here)',
      'Unit (Reference)',
      'Purchase Pack (Reference)',
      'Min Stock (Editable - in pack units)'
    ];
    
    // Create CSV rows with reference data pre-filled
    const csvRows = items.map(item => [
      item.typeId?.name || '',
      item.name || '',
      '', // PACK STOCK - to be filled by user (most common)
      item.baseContent || '', // Pre-filled reference
      item.packUnit || '', // Pre-filled reference
      '', // BASE STOCK - to be filled by user (alternative)
      item.unit || '', // Pre-filled reference
      item.purchasePack || '', // Pre-filled reference
      item.minStock || '' // Pre-filled, editable
    ]);
    
    // Combine into CSV format
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');
    
    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="stock-reconciliation-template-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
    
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}

