import express from "express";
import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Item } from "../models/Item.js";

export const transactionsRouter = express.Router();

// Create a transaction
transactionsRouter.post("/", async (req, res) => {
  try {
    const { itemId, direction, quantity } = req.body;
    if (!itemId || !mongoose.isValidObjectId(itemId)) {
      return res.status(400).json({ error: "Invalid itemId" });
    }
    if (!["in", "out"].includes(direction)) {
      return res.status(400).json({ error: "Invalid direction" });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ error: "Quantity must be > 0" });
    }

    const exists = await Item.findById(itemId).select("_id");
    if (!exists) return res.status(404).json({ error: "Item not found" });

    const tx = await Transaction.create({ itemId, direction, quantity: qty });
    res.status(201).json(tx);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// List transactions (paginated, optional filters)
transactionsRouter.get("/", async (req, res) => {
  let { page = "1", limit = "50", itemId, direction } = req.query;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.max(parseInt(limit, 10) || 50, 1);
  const filter = {};
  if (itemId && mongoose.isValidObjectId(itemId)) filter.itemId = itemId;
  if (direction && ["in", "out"].includes(direction)) filter.direction = direction;

  const total = await Transaction.countDocuments(filter);
  const txs = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .populate("itemId", "name type baseContentUnit purchasePackUnit");
  const pages = Math.max(Math.ceil(total / limitNum), 1);
  res.json({ transactions: txs, total, page: pageNum, pages, limit: limitNum });
});

// Current stock per item (sum IN - sum OUT)
transactionsRouter.get("/stock", async (_req, res) => {
  const pipeline = [
    {
      $group: {
        _id: "$itemId",
        stock: {
          $sum: {
            $cond: [{ $eq: ["$direction", "in"] }, "$quantity", { $multiply: ["$quantity", -1] }],
          },
        },
      },
    },
    { $lookup: { from: "items", localField: "_id", foreignField: "_id", as: "item" } },
    { $unwind: "$item" },
    {
      $project: {
        _id: 0,
        itemId: "$item._id",
        name: "$item.name",
        type: "$item.type",
        stock: 1,
      },
    },
    { $sort: { name: 1 } },
  ];
  const rows = await Transaction.aggregate(pipeline);
  res.json({ stock: rows });
});
