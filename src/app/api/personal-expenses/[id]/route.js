import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { PersonalExpense } from '@/lib/models/PersonalExpense';

export async function PUT(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  const body = await request.json();

  try {
    const expense = await PersonalExpense.findByIdAndUpdate(id, body, { new: true });
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  await dbConnect();
  const params = await context.params;
  const { id } = params;
  
  await PersonalExpense.findByIdAndDelete(id);
  return new NextResponse(null, { status: 204 });
}
