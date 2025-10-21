import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { Transaction } from '@/lib/models/Transaction';

export async function GET() {
  await dbConnect();

  const pipeline = [
    {
      $group: {
        _id: '$itemId',
        stockBase: {
          $sum: {
            $cond: [
              { $eq: ['$direction', 'in'] },
              { $ifNull: ['$quantityBase', '$quantity'] },
              { $multiply: [{ $ifNull: ['$quantityBase', '$quantity'] }, -1] },
            ],
          },
        },
        stockPack: {
          $sum: {
            $cond: [
              { $eq: ['$direction', 'in'] },
              { $ifNull: ['$quantityPack', '$quantity'] },
              { $multiply: [{ $ifNull: ['$quantityPack', '$quantity'] }, -1] },
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'items',
        localField: '_id',
        foreignField: '_id',
        as: 'item',
      },
    },
    { $unwind: '$item' },
    {
      $project: {
        _id: 0,
        itemId: '$item._id',
        name: '$item.name',
        type: '$item.type',
        baseContentUnit: '$item.baseContentUnit',
        purchasePackUnit: '$item.purchasePackUnit',
        stockBase: 1,
        stockPack: 1,
      },
    },
    { $sort: { name: 1 } },
  ];

  const rows = await Transaction.aggregate(pipeline);
  return NextResponse.json({ stock: rows });
}

