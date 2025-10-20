import mongoose from "mongoose";
import dotenv from "dotenv";
import { Type } from "./models/Type.js";
import { Item } from "./models/Item.js";

dotenv.config();

const ACRONYMS = new Set(["PPE", "FOH", "KG", "LT", "ML", "GR", "XL", "L", "M", "X", "EQP", "EQP.", "UK", "USA"]);
const SMALL_WORDS = new Set(["and", "or", "of", "the", "a", "an", "to", "in", "on", "for", "by", "with"]);

function toTitleCase(input) {
  if (!input || typeof input !== "string") return input;
  const trimmed = input.trim();
  // Normalize spaces
  const collapsed = trimmed.replace(/\s+/g, " ");
  return collapsed
    .split(" ")
    .map((word, idx) => {
      const upper = word.toUpperCase();
      const lower = word.toLowerCase();
      // Preserve acronyms (all caps, short tokens)
      if (ACRONYMS.has(upper)) return upper;
      // Keep symbols as-is
      if (/^[^A-Za-z0-9]+$/.test(word)) return word;
      // Lowercase small words except if first word
      if (idx !== 0 && SMALL_WORDS.has(lower)) return lower;
      // Title case general words
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI missing");
    process.exit(1);
  }
  await mongoose.connect(mongoUri, { dbName: "inventory" });
  console.log("Connected to MongoDB");

  // Normalize Types
  const types = await Type.find({});
  let typeUpdates = 0;
  for (const t of types) {
    const normalized = toTitleCase(t.name);
    if (normalized && normalized !== t.name) {
      try {
        await Type.updateOne({ _id: t._id }, { $set: { name: normalized } });
        typeUpdates++;
      } catch (e) {
        // If unique conflict, merge items to the existing normalized type and delete duplicate
        const existing = await Type.findOne({ name: normalized });
        if (existing) {
          await Item.updateMany({ typeId: t._id }, { $set: { typeId: existing._id, type: normalized } });
          await Type.deleteOne({ _id: t._id });
          typeUpdates++;
        } else {
          console.warn("Type update error:", t.name, e.message);
        }
      }
    }
  }

  // Refresh types map
  const typesAfter = await Type.find({});
  const nameToType = new Map(typesAfter.map(tt => [tt.name, tt]));

  // Normalize Items names and type strings; ensure typeId points to normalized type
  const items = await Item.find({});
  let itemNameUpdates = 0;
  let itemTypeLinkUpdates = 0;
  for (const it of items) {
    const newName = toTitleCase(it.name);
    const newTypeName = toTitleCase(it.type);
    const updates = {};
    if (newName && newName !== it.name) updates.name = newName;
    if (newTypeName && newTypeName !== it.type) updates.type = newTypeName;

    // Link typeId
    const targetType = nameToType.get(newTypeName || it.type);
    if (targetType && (!it.typeId || String(it.typeId) !== String(targetType._id))) {
      updates.typeId = targetType._id;
    }

    if (Object.keys(updates).length) {
      await Item.updateOne({ _id: it._id }, { $set: updates });
      if (updates.name) itemNameUpdates++;
      if (updates.type || updates.typeId) itemTypeLinkUpdates++;
    }
  }

  console.log(JSON.stringify({ typeUpdates, itemNameUpdates, itemTypeLinkUpdates }));
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
