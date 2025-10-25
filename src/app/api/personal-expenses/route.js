import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { PersonalExpense } from '@/lib/models/PersonalExpense';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  
  const { 
    expenseDate, 
    description, 
    expenseType,
    totalAmount,
    vatAmount,
    hasVAT,
    vatPercentage,
    suggestedDiscountAmount,
    confirmedDiscountAmount,
    payrollDiscountDate,
    payrollDiscountStatus,
    payrollDiscountedMonth,
    payrollDiscountedYear,
    payrollNotes,
    reimbursementAmount,
    reimbursementDate,
    reimbursementTransactionId,
    reimbursementStatus,
    reimbursementCompletedDate,
    reimbursementProofUrl,
    reimbursementNotes,
    employeeName,
    employeeId,
    category,
    receiptUrl,
    notes
  } = body;

  // Validation
  if (!description || !description.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  if (!expenseType) {
    return NextResponse.json({ error: 'Expense type is required' }, { status: 400 });
  }
  if (!totalAmount || Number(totalAmount) <= 0) {
    return NextResponse.json({ error: 'Total amount must be greater than 0' }, { status: 400 });
  }
  if (!category) {
    return NextResponse.json({ error: 'Category is required' }, { status: 400 });
  }

  try {
    const expenseData = {
      expenseDate: expenseDate || new Date(),
      description: description.trim(),
      expenseType,
      totalAmount: Number(totalAmount),
      vatAmount: Number(vatAmount) || 0,
      hasVAT: Boolean(hasVAT),
      vatPercentage: Number(vatPercentage) || 0,
      category: category.trim(),
      receiptUrl: receiptUrl || undefined,
      notes: notes?.trim() || undefined,
      employeeName: employeeName?.trim() || undefined,
      employeeId: employeeId?.trim() || undefined,
    };

    // Add payroll discount fields if applicable
    if (expenseType === 'personal_requires_payroll_discount') {
      expenseData.suggestedDiscountAmount = Number(suggestedDiscountAmount) || undefined;
      expenseData.confirmedDiscountAmount = Number(confirmedDiscountAmount) || undefined;
      expenseData.payrollDiscountDate = payrollDiscountDate || undefined;
      expenseData.payrollDiscountStatus = payrollDiscountStatus || 'pending';
      expenseData.payrollDiscountedMonth = payrollDiscountedMonth || undefined;
      expenseData.payrollDiscountedYear = payrollDiscountedYear || undefined;
      expenseData.payrollNotes = payrollNotes?.trim() || undefined;
    }

    // Add reimbursement fields if applicable
    if (expenseType === 'personal_requires_reimbursement') {
      expenseData.reimbursementAmount = Number(reimbursementAmount) || undefined;
      expenseData.reimbursementDate = reimbursementDate || undefined;
      expenseData.reimbursementTransactionId = reimbursementTransactionId?.trim() || undefined;
      expenseData.reimbursementStatus = reimbursementStatus || 'pending';
      expenseData.reimbursementCompletedDate = reimbursementCompletedDate || undefined;
      expenseData.reimbursementProofUrl = reimbursementProofUrl || undefined;
      expenseData.reimbursementNotes = reimbursementNotes?.trim() || undefined;
    }

    const expense = await PersonalExpense.create(expenseData);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating personal expense:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const type = searchParams.get('type');

  const filter = {};
  
  // Filter by expense type
  if (type && type !== 'all') {
    filter.expenseType = type;
  }

  // Filter by status
  if (status && status !== 'all') {
    if (status === 'pending') {
      filter.$or = [
        { payrollDiscountStatus: 'pending' },
        { reimbursementStatus: 'pending' }
      ];
    }
    if (status === 'completed') {
      filter.$or = [
        { payrollDiscountStatus: 'completed' },
        { reimbursementStatus: 'completed' }
      ];
    }
  }

  try {
    const expenses = await PersonalExpense.find(filter)
      .sort({ expenseDate: -1 });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching personal expenses:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
