import mongoose from "mongoose";
import dotenv from "dotenv";
import { Item } from "./models/Item.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "inventory" });
  const res = await Item.updateMany({}, { $set: { purchasePackQuantity: 1, purchasePackUnit: "unit" } });
  console.log(JSON.stringify({ matched: res.matchedCount ?? res.nMatched, modified: res.modifiedCount ?? res.nModified }));
  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
