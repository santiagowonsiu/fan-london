import mongoose from "mongoose";
import dotenv from "dotenv";
import { Item } from "./models/Item.js";

dotenv.config();

// Regexes to find patterns like "X 1 LT", "X 500 GR", "X 2/4LT", "X 1.5 KG", "X 250ML", "X 10 PCS"
const PATTERNS = [
  /\bX\s*([0-9]+\.?[0-9]*)\s*([A-Z]+)\b/i,
  /\b([0-9]+\.?[0-9]*)\s*([A-Z]+)\b/i,
];

function extractUnit(name) {
  for (const rx of PATTERNS) {
    const m = name.match(rx);
    if (m) {
      return { value: m[1], unitRaw: m[2] };
    }
  }
  return null;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "inventory" });
  const items = await Item.find({}).select("name");
  const unitCounts = new Map();
  const examples = new Map();
  let matched = 0;

  for (const it of items) {
    const res = extractUnit(it.name || "");
    if (res) {
      matched++;
      const key = res.unitRaw.toUpperCase();
      unitCounts.set(key, (unitCounts.get(key) || 0) + 1);
      if (!examples.has(key)) examples.set(key, it.name);
    }
  }

  const sorted = [...unitCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0,100);
  const out = {
    totalItems: items.length,
    matchedItems: matched,
    unitFrequencies: sorted.map(([unit, count]) => ({ unit, count, example: examples.get(unit) })),
  };
  console.log(JSON.stringify(out, null, 2));
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
