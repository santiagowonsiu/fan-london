import mongoose from "mongoose";
import dotenv from "dotenv";
import { Item } from "./models/Item.js";

dotenv.config();

// Normalize units mapping
const UNIT_MAP = new Map([
  ["GR", "g"],
  ["G", "g"],
  ["KG", "kg"],
  ["KGH", "kg"],
  ["ML", "ml"],
  ["LT", "l"],
  ["L", "l"],
  ["CM", "cm"],
  ["MM", "mm"],
  ["M", "m"],
  ["PCS", "pieces"],
  ["UNIT", "unit"],
  ["BAGS", "bags"],
  ["UND", "und"], // keep as provided
]);

const PATTERNS = [
  /\bX\s*([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)\b/, // X 1 LT
  /\b([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)\b/,     // 1 LT
];

function parseContent(name) {
  if (!name) return null;
  for (const rx of PATTERNS) {
    const m = name.match(rx);
    if (m) {
      const value = parseFloat(m[1]);
      const raw = m[2].toUpperCase();
      const unit = UNIT_MAP.get(raw) || raw.toLowerCase();
      if (!Number.isNaN(value)) return { value, unit };
    }
  }
  return null;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }
  await mongoose.connect(mongoUri, { dbName: "inventory" });
  console.log("Connected to MongoDB");

  const items = await Item.find({});
  let updated = 0;
  for (const it of items) {
    const parsed = parseContent(it.name);
    if (parsed) {
      await Item.updateOne({ _id: it._id }, { 
        $set: { baseContentValue: parsed.value, baseContentUnit: parsed.unit }
      });
      updated++;
    }
  }

  console.log(JSON.stringify({ updated, total: items.length }));
  await mongoose.disconnect();
}

run().catch((e)=>{ console.error(e); process.exit(1); });
