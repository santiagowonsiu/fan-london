import mongoose from "mongoose";
import dotenv from "dotenv";
import { Item } from "./models/Item.js";

dotenv.config();

const PACK_TOKENS = new Set(["PCS","PIECES","UNIT","UND","BAG","BAGS","BOX","PACK","PACKS"]);

const X_RX = /\bX\s*([0-9]+(?:\/[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)?\b/g;

function hasExplicitPack(name){
  let m; let last = null;
  while ((m = X_RX.exec(name)) !== null) last = m;
  if (!last) return null;
  const token = (last[2]||"").toUpperCase();
  if (PACK_TOKENS.has(token)) {
    const valRaw = last[1];
    const value = valRaw.includes("/") ? (Number(valRaw.split("/")[0]) / Number(valRaw.split("/")[1])) : Number(valRaw);
    return Number.isNaN(value) ? null : { value, unit: token.toLowerCase() };
  }
  return null;
}

async function run(){
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "inventory" });
  const items = await Item.find({});
  let fixed = 0, explicit = 0;
  for (const it of items){
    const exp = hasExplicitPack(it.name||"");
    if (exp){
      // Use explicit pack for purchasePack, keep base content as previously parsed
      await Item.updateOne({_id: it._id}, { $set: { purchasePackQuantity: exp.value, purchasePackUnit: exp.unit } });
      explicit++;
    } else {
      // Default purchase pack to 1 unit
      await Item.updateOne({_id: it._id}, { $set: { purchasePackQuantity: 1, purchasePackUnit: "unit" } });
      fixed++;
    }
  }
  console.log(JSON.stringify({ fixedDefaulted: fixed, fixedExplicit: explicit }));
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
