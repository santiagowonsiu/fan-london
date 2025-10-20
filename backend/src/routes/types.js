import express from "express";
import { Type } from "../models/Type.js";

export const typesRouter = express.Router();

// List all types sorted by name
typesRouter.get("/", async (req, res) => {
  const types = await Type.find({}).sort({ name: 1 });
  res.json(types);
});

// Create a type
typesRouter.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: "Type name required" });
    const t = await Type.create({ name: name.trim() });
    res.status(201).json(t);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
