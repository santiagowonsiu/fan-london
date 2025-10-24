import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { DirectPurchase } from '@/lib/models/DirectPurchase';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { supplier, purchaseDate, description, amount, invoiceUrl, isPaid, paymentMethod, paymentDate, notes } = body;

  if (!supplier || !supplier.trim()) {
    return NextResponse.json({ error: 'Supplier is required' }, { status: 400 });
  }
  if (!description || !description.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
  }
  if (isPaid && !paymentMethod) {
    return NextResponse.json({ error: 'Payment method is required when marked as paid' }, { status: 400 });
  }

  try {
    const purchase = await DirectPurchase.create({
      supplier: supplier.trim(),
      purchaseDate: purchaseDate || new Date(),
      description: description.trim(),
      amount: Number(amount),
      invoiceUrl: invoiceUrl || undefined,
      isPaid: Boolean(isPaid),
      paymentMethod: paymentMethod || undefined,
      paymentDate: paymentDate || undefined,
      notes: notes?.trim() || undefined
    });
    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const supplier = searchParams.get('supplier');
  const payment = searchParams.get('payment');

  const filter = {};
  if (status && status !== 'all') {
    // Map status to isPaid
    if (status === 'pending') filter.isPaid = false;
    if (status === 'completed') filter.isPaid = true;
  }
  if (supplier && supplier !== 'all') filter.supplier = supplier;
  if (payment && payment !== 'all') {
    if (payment === 'paid') filter.isPaid = true;
    if (payment === 'unpaid') filter.isPaid = false;
  }

  const purchases = await DirectPurchase.find(filter)
    .sort({ purchaseDate: -1 });

  return NextResponse.json({ purchases });
}
