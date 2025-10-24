import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { ExternalOrder } from '@/lib/models/ExternalOrder';
import { DirectPurchase } from '@/lib/models/DirectPurchase';
import { PersonalExpense } from '@/lib/models/PersonalExpense';

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const dateRange = searchParams.get('dateRange') || 'all';
  const supplier = searchParams.get('supplier') || 'all';
  const payment = searchParams.get('payment') || 'all';

  // Build date filter
  let dateFilter = {};
  if (dateRange !== 'all') {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        };
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { $gte: weekAgo };
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        dateFilter = { $gte: monthAgo };
        break;
      case 'quarter':
        const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        dateFilter = { $gte: quarterAgo };
        break;
      case 'year':
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        dateFilter = { $gte: yearAgo };
        break;
    }
  }

  // Build filters
  const externalOrderFilter = { ...dateFilter };
  const directPurchaseFilter = { ...dateFilter };
  const personalExpenseFilter = { ...dateFilter };

  if (supplier !== 'all') {
    externalOrderFilter.supplier = supplier;
    directPurchaseFilter.supplier = supplier;
  }

  if (payment !== 'all') {
    if (payment === 'paid') {
      directPurchaseFilter.isPaid = true;
    } else if (payment === 'unpaid') {
      directPurchaseFilter.isPaid = false;
    }
  }

  try {
    // Get external orders summary
    const externalOrders = await ExternalOrder.find(externalOrderFilter);
    const externalOrdersSummary = {
      total: externalOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      paid: externalOrders.filter(order => order.status === 'received').reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      unpaid: externalOrders.filter(order => order.status !== 'received').reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      count: externalOrders.length
    };

    // Get direct purchases summary
    const directPurchases = await DirectPurchase.find(directPurchaseFilter);
    const directPurchasesSummary = {
      total: directPurchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0),
      paid: directPurchases.filter(purchase => purchase.isPaid).reduce((sum, purchase) => sum + (purchase.amount || 0), 0),
      unpaid: directPurchases.filter(purchase => !purchase.isPaid).reduce((sum, purchase) => sum + (purchase.amount || 0), 0),
      count: directPurchases.length
    };

    // Get personal expenses summary
    const personalExpenses = await PersonalExpense.find(personalExpenseFilter);
    const personalExpensesSummary = {
      total: personalExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
      count: personalExpenses.length
    };

    const summary = {
      externalOrders: externalOrdersSummary,
      directPurchases: directPurchasesSummary,
      personalExpenses: personalExpensesSummary
    };

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
