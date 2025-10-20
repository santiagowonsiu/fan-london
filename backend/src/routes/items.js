import express from "express";
import { Item } from "../models/Item.js";

export const itemsRouter = express.Router();

// List items, optional archived filter, search, and pagination
itemsRouter.get("/", async (req, res) => {
  const { archived, q } = req.query;
  let { page = "1", limit = "50" } = req.query;

  const filter = {};
  if (archived === "true") filter.archived = true;
  if (archived === "false") filter.archived = false;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { type: { $regex: q, $options: "i" } },
    ];
  }

  // Handle limit: number, or "all" to return everything
  const allRequested = String(limit).toLowerCase() === "all";
  const limitNum = allRequested ? 0 : Math.max(parseInt(limit, 10) || 50, 0);
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);

  const total = await Item.countDocuments(filter);
  const queryExec = Item.find(filter).sort({ type: 1, name: 1 });
  if (!allRequested && limitNum > 0) {
    queryExec.skip((pageNum - 1) * limitNum).limit(limitNum);
  }
  const items = await queryExec.exec();
  const pages = !allRequested && limitNum > 0 ? Math.max(Math.ceil(total / limitNum), 1) : 1;

  res.json({ items, total, page: pageNum, pages, limit: allRequested ? "all" : limitNum });
});

// Name suggestions for avoiding duplicates
itemsRouter.get("/suggest", async (req, res) => {
  const { q = "" } = req.query;
  if (!q) return res.json([]);
  const items = await Item.find({ name: { $regex: q, $options: "i" } })
    .select("name type archived")
    .limit(10)
    .sort({ name: 1 });
  res.json(items);
});

// Create
itemsRouter.post("/", async (req, res) => {
  try {
    const { type, name, archived } = req.body;
    const item = await Item.create({ type, name, archived: !!archived });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update
itemsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, archived } = req.body;
    const item = await Item.findByIdAndUpdate(
      id,
      { type, name, archived },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Archive toggle
itemsRouter.post("/:id/archive", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Not found" });
    item.archived = !item.archived;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
itemsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await Item.findByIdAndDelete(id);
  res.status(204).end();
});
