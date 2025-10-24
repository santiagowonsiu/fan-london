import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { PersonalExpense } from '@/lib/models/PersonalExpense';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { expenseDate, description, amount, category, receiptUrl, isReimbursed, reimbursementDate, notes } = body;

  if (!description || !description.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  try {
    const expense = await PersonalExpense.create({
      expenseDate: expenseDate || new Date(),
      description: description.trim(),
      amount: Number(amount),
      category: category.trim(),
      receiptUrl: receiptUrl || undefined,
      isReimbursed: Boolean(isReimbursed),
      reimbursementDate: reimbursementDate || undefined,
      notes: notes?.trim() || undefined
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  const filter = {};
  if (status && status !== 'all') {
    if (status === 'pending') filter.isReimbursed = false;
    if (status === 'reimbursed') filter.isReimbursed = true;
  }
  if (category && category !== 'all') filter.category = category;

  const expenses = await PersonalExpense.find(filter)
    .sort({ expenseDate: -1 });

  return NextResponse.json({ expenses });
}
