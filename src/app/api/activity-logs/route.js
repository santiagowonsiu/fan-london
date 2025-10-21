import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { ActivityLog } from '@/lib/models/ActivityLog';

export async function POST(request) {
  await dbConnect();
  const body = await request.json();
  const { action, entityType, entityId, entityName, details, justification, user } = body;

  if (!action || !entityType || !entityId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const log = await ActivityLog.create({
      action,
      entityType,
      entityId,
      entityName,
      details,
      justification,
      user: user || 'System'
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const action = searchParams.get('action');
  const entityType = searchParams.get('entityType');

  const filter = {};
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  const total = await ActivityLog.countDocuments(filter);
  const logs = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const pages = Math.max(Math.ceil(total / limit), 1);

  return NextResponse.json({
    logs,
    total,
    page,
    pages,
    limit
  });
}

