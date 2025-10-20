import mongoose from "mongoose";
import dotenv from "dotenv";
import { Item } from "./models/Item.js";

dotenv.config();

const LENGTH_UNITS = new Set(["CM","MM","M"]);
const PACK_MAP = new Map([
  ["PCS","pieces"], ["PIECES","pieces"], ["UNIT","unit"], ["UND","unit"], ["BAG","bag"], ["BAGS","bags"], ["BOX","box"], ["PACK","pack"], ["PACKS","packs"],
  ["GR","g"], ["G","g"], ["KG","kg"], ["KGH","kg"], ["ML","ml"], ["LT","l"], ["L","l"],
]);

// Find all X <num> <token> occurrences and prefer the last non-length one
const OCCURRENCE_RX = /\bX\s*([0-9]+(?:\/[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)\b/g;

function parseLastPack(name) {
  if (!name) return null;
  const matches = [];
  let m;
  while ((m = OCCURRENCE_RX.exec(name)) !== null) {
    matches.push(m);
  }
  // prefer last non-length unit
  for (let i = matches.length - 1; i >= 0; i--) {
    const valRaw = matches[i][1];
    const unitRaw = matches[i][2].toUpperCase();
    if (LENGTH_UNITS.has(unitRaw)) continue; // skip length specs
    const unit = PACK_MAP.get(unitRaw) || unitRaw.toLowerCase();
    // handle ratios like 2/4 -> 0.5 (rare, but seen)
    const value = valRaw.includes("/") ? (Number(valRaw.split("/")[0]) / Number(valRaw.split("/")[1])) : Number(valRaw);
    if (!Number.isNaN(value)) return { value, unit };
  }
  return null;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri, { dbName: "inventory" });
  const items = await Item.find({});
  let updated = 0, defaulted = 0;

  for (const it of items) {
    const parsed = parseLastPack(it.name);
    if (parsed) {
      await Item.updateOne({ _id: it._id }, { $set: {
        baseContentValue: parsed.value,
        baseContentUnit: parsed.unit,
        purchasePackQuantity: parsed.value,
        purchasePackUnit: parsed.unit,
      }});
      updated++;
    } else {
      // default to 1 unit if missing
      await Item.updateOne({ _id: it._id }, { $set: {
        baseContentValue: 1,
        baseContentUnit: it.baseContentUnit || "unit",
      }});
      defaulted++;
    }
  }

  console.log(JSON.stringify({ updated, defaulted, total: items.length }));
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
