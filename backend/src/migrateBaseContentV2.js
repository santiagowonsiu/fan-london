import mongoose from "mongoose";
import dotenv from "dotenv";
import { Item } from "./models/Item.js";

dotenv.config();

const WEIGHT_UNITS = new Map([
  ["GR","g"], ["G","g"], ["KG","kg"], ["KGH","kg"],
  ["ML","ml"], ["LT","l"], ["L","l"],
]);
const LENGTH_UNITS = new Set(["CM","MM","M"]);
const PACK_MAP = new Map([
  ["PCS","pieces"], ["PIECES","pieces"], ["UNIT","unit"], ["UND","unit"], ["BAG","bag"], ["BAGS","bags"], ["BOX","box"], ["PACK","pack"], ["PACKS","packs"],
]);

const TOKEN_RX = /\b([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)\b/g; // generic number+token anywhere
const X_RX = /\bX\s*([0-9]+(?:\/[0-9]+)?|[0-9]+(?:\.[0-9]+)?)(?:\s*([A-Za-z]+))?\b/g; // X number [token]

function chooseBaseContent(name) {
  const tokens = [];
  let m;
  while ((m = TOKEN_RX.exec(name)) !== null) {
    tokens.push({ value: Number(m[1]), unitRaw: (m[2]||"").toUpperCase(), index: m.index });
  }
  // Prefer any weight/volume token anywhere
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    const mapped = WEIGHT_UNITS.get(t.unitRaw);
    if (mapped && !Number.isNaN(t.value)) {
      return { value: t.value, unit: mapped };
    }
  }
  // Else prefer last X <num> <token> pack (skip length)
  const xMatches = [];
  while ((m = X_RX.exec(name)) !== null) {
    xMatches.push(m);
  }
  for (let i = xMatches.length - 1; i >= 0; i--) {
    const valRaw = xMatches[i][1];
    const tokenRaw = (xMatches[i][2]||"").toUpperCase();
    const value = valRaw.includes("/") ? (Number(valRaw.split("/")[0]) / Number(valRaw.split("/")[1])) : Number(valRaw);
    if (Number.isNaN(value)) continue;
    if (tokenRaw && LENGTH_UNITS.has(tokenRaw)) continue;
    const unit = tokenRaw ? (PACK_MAP.get(tokenRaw) || WEIGHT_UNITS.get(tokenRaw) || tokenRaw.toLowerCase()) : undefined;
    if (unit) return { value, unit };
    // No token: heuristic — if value looks like weight (50–5000), assume grams, else pieces
    if (value >= 50 && value <= 5000) return { value, unit: "g" };
    return { value, unit: "pieces" };
  }
  // Fallback default
  return { value: 1, unit: "unit" };
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  await mongoose.connect(mongoUri, { dbName: "inventory" });
  const items = await Item.find({});
  let updated = 0;
  for (const it of items) {
    const bc = chooseBaseContent(it.name || "");
    await Item.updateOne({ _id: it._id }, {
      $set: {
        baseContentValue: bc.value,
        baseContentUnit: bc.unit,
        purchasePackQuantity: bc.value,
        purchasePackUnit: bc.unit,
      }
    });
    updated++;
  }
  console.log(JSON.stringify({ updated }));
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
