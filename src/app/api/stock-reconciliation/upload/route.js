import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Item } from '@/lib/models/Item';
import { Transaction } from '@/lib/models/Transaction';
import { StockReconciliation } from '@/lib/models/StockReconciliation';
import { ActivityLog } from '@/lib/models/ActivityLog';

// Helper function to parse CSV
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    row._rowNumber = i + 1;
    rows.push(row);
  }
  
  return rows;
}

// Helper function to calculate stock from transactions
async function calculateCurrentStock(itemId, beforeDate) {
  const transactions = await Transaction.find({
    itemId,
    createdAt: { $lt: new Date(beforeDate) }
  }).sort({ createdAt: 1 });
  
  let packStock = 0;
  let baseStock = 0;
  
  for (const tx of transactions) {
    const multiplier = tx.direction === 'input' ? 1 : -1;
    packStock += (tx.quantityPack || 0) * multiplier;
    baseStock += (tx.quantityBase || 0) * multiplier;
  }
  
  return { packStock, baseStock };
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const formData = await request.formData();
    const file = formData.get('file');
    const reconciliationDate = formData.get('reconciliationDate');
    const performedBy = formData.get('performedBy');
    const notes = formData.get('notes');
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!reconciliationDate) {
      return NextResponse.json({ error: 'Reconciliation date is required' }, { status: 400 });
    }
    
    if (!performedBy) {
      return NextResponse.json({ error: 'Performed by is required' }, { status: 400 });
    }
    
    // Read and parse CSV
    const text = await file.text();
    const rows = parseCSV(text);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Empty CSV file' }, { status: 400 });
    }
    
    // Fetch all items for lookup
    const items = await Item.find({ archived: false }).populate('typeId', 'name');
    const itemMap = new Map();
    items.forEach(item => {
      const key = `${item.typeId?.name || ''}_${item.name}`.toLowerCase();
      itemMap.set(key, item);
    });
    
    // Process each row
    const adjustedItems = [];
    const unchangedItems = [];
    const invalidItems = [];
    const minStockChanges = []; // Track minStock changes
    
    for (const row of rows) {
      const type = row['Type'] || '';
      const itemName = row['Item'] || '';
      const packStockInput = row['PACK STOCK (Count your packages/boxes here)'];
      const baseStockInput = row['BASE STOCK (OR count individual units here)'];
      const minStockInput = row['Min Stock (Editable - in pack units)'];
      
      // Skip rows with no item name
      if (!itemName.trim()) {
        continue;
      }
      
      // Find item
      const key = `${type}_${itemName}`.toLowerCase();
      const item = itemMap.get(key);
      
      if (!item) {
        invalidItems.push({
          rowNumber: row._rowNumber,
          type,
          itemName,
          inputPackValue: packStockInput,
          inputBaseValue: baseStockInput,
          errorMessage: 'Item not found in database'
        });
        continue;
      }
      
      // Parse input values
      const packInput = packStockInput ? parseFloat(packStockInput) : null;
      const baseInput = baseStockInput ? parseFloat(baseStockInput) : null;
      
      // Validate input
      if (!packInput && !baseInput) {
        invalidItems.push({
          rowNumber: row._rowNumber,
          type,
          itemName,
          inputPackValue: packStockInput,
          inputBaseValue: baseStockInput,
          errorMessage: 'Must provide either Pack Stock or Base Stock'
        });
        continue;
      }
      
      if (packInput && isNaN(packInput)) {
        invalidItems.push({
          rowNumber: row._rowNumber,
          type,
          itemName,
          inputPackValue: packStockInput,
          inputBaseValue: baseStockInput,
          errorMessage: 'Invalid Pack Stock value'
        });
        continue;
      }
      
      if (baseInput && isNaN(baseInput)) {
        invalidItems.push({
          rowNumber: row._rowNumber,
          type,
          itemName,
          inputPackValue: packStockInput,
          inputBaseValue: baseStockInput,
          errorMessage: 'Invalid Base Stock value'
        });
        continue;
      }
      
      // Calculate new stock values
      let newPackStock, newBaseStock;
      let inputField;
      
      if (packInput && !baseInput) {
        // Pack provided, calculate base
        newPackStock = packInput;
        newBaseStock = packInput * (item.baseContent || 1);
        inputField = 'pack';
      } else if (baseInput && !packInput) {
        // Base provided, calculate pack
        newBaseStock = baseInput;
        newPackStock = baseInput / (item.baseContent || 1);
        inputField = 'base';
      } else {
        // Both provided, use both
        newPackStock = packInput;
        newBaseStock = baseInput;
        inputField = 'both';
      }
      
      // Get current stock before reconciliation date
      const currentStock = await calculateCurrentStock(item._id, reconciliationDate);
      
      // Calculate differences
      const packDifference = newPackStock - currentStock.packStock;
      const baseDifference = newBaseStock - currentStock.baseStock;
      
      const reconciliationItem = {
        itemId: item._id,
        itemName: item.name,
        type: item.typeId?.name || '',
        previousPackStock: currentStock.packStock,
        previousBaseStock: currentStock.baseStock,
        newPackStock,
        newBaseStock,
        packDifference,
        baseDifference,
        inputField,
        inputPackValue: packInput,
        inputBaseValue: baseInput
      };
      
      // Check and update minStock if changed
      if (minStockInput !== undefined && minStockInput !== '') {
        const newMinStock = parseFloat(minStockInput);
        if (!isNaN(newMinStock) && newMinStock !== item.minStock) {
          minStockChanges.push({
            itemName: item.name,
            type: item.typeId?.name || '',
            previousMinStock: item.minStock || 0,
            newMinStock: newMinStock
          });
          
          // Update item's minStock
          await Item.findByIdAndUpdate(item._id, { minStock: newMinStock });
        }
      }
      
      // Check if stock changed
      if (Math.abs(packDifference) < 0.001 && Math.abs(baseDifference) < 0.001) {
        reconciliationItem.status = 'unchanged';
        unchangedItems.push(reconciliationItem);
      } else {
        reconciliationItem.status = 'adjusted';
        adjustedItems.push(reconciliationItem);
        
        // Create adjustment transaction
        await Transaction.create({
          itemId: item._id,
          direction: packDifference >= 0 ? 'input' : 'output',
          quantityPack: Math.abs(packDifference),
          quantityBase: Math.abs(baseDifference),
          unitUsed: 'pack',
          observations: `Stock reconciliation adjustment - ${performedBy}`,
          personName: performedBy,
          orderType: 'stock_reconciliation',
          createdAt: new Date(reconciliationDate)
        });
      }
    }
    
    // Create reconciliation record
    const reconciliation = await StockReconciliation.create({
      reconciliationDate: new Date(reconciliationDate),
      performedBy,
      totalItems: rows.length,
      adjustedCount: adjustedItems.length,
      unchangedCount: unchangedItems.length,
      invalidCount: invalidItems.length,
      adjustedItems,
      unchangedItems,
      invalidItems,
      fileName: file.name,
      fileRows: rows.length,
      notes,
      status: 'completed'
    });
    
    // Create activity log
    const activityDetails = {
      reconciliationDate,
      performedBy,
      adjustedCount: adjustedItems.length,
      unchangedCount: unchangedItems.length,
      invalidCount: invalidItems.length,
      totalItems: rows.length
    };
    
    // Add minStock changes to activity details
    if (minStockChanges.length > 0) {
      activityDetails.minStockChanges = minStockChanges;
      activityDetails.minStockChangedCount = minStockChanges.length;
    }
    
    await ActivityLog.create({
      action: 'stock_reconciliation',
      entityType: 'stock_reconciliation',
      entityId: reconciliation._id,
      entityName: `Stock Reconciliation - ${new Date(reconciliationDate).toLocaleDateString()}`,
      details: activityDetails,
      justification: notes || 'Stock reconciliation performed'
    });
    
    // If minStock changed, create separate activity log for clarity
    if (minStockChanges.length > 0) {
      await ActivityLog.create({
        action: 'minstock_bulk_update',
        entityType: 'products',
        entityName: `Min Stock Updated (${minStockChanges.length} products)`,
        details: {
          changes: minStockChanges,
          performedBy,
          source: 'stock_reconciliation',
          reconciliationId: reconciliation._id
        },
        justification: `Min stock levels updated during stock reconciliation`
      });
    }
    
    return NextResponse.json({
      success: true,
      reconciliationId: reconciliation._id,
      summary: {
        totalItems: rows.length,
        adjusted: adjustedItems.length,
        unchanged: unchangedItems.length,
        invalid: invalidItems.length,
        minStockChanged: minStockChanges.length
      }
    });
    
  } catch (error) {
    console.error('Error processing stock reconciliation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process reconciliation' },
      { status: 500 }
    );
  }
}

