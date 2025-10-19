import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { fileURLToPath } from "url";
import { Item } from "./models/Item.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedFromCsvOnce() {
  const csvPath = path.resolve(__dirname, "../inventory-list.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("CSV not found:", csvPath);
    return;
  }
  const fileContent = fs.readFileSync(csvPath, "utf8");
  const records = [];
  await new Promise((resolve, reject) => {
    parse(
      fileContent,
      { columns: true, skip_empty_lines: true, trim: true },
      (err, rows) => {
        if (err) return reject(err);
        for (const row of rows) {
          // Handle header variants: TYPE/TIPE and ITEM
          const typeVal = row.TYPE || row.TIPE || row.type || row.tipe || "";
          const nameVal = row.ITEM || row.item || "";
          if (!typeVal || !nameVal) continue;
          records.push({ type: String(typeVal).trim(), name: String(nameVal).trim() });
        }
        resolve();
      }
    );
  });

  for (const rec of records) {
    try {
      await Item.updateOne(
        { name: rec.name },
        { $setOnInsert: { type: rec.type, name: rec.name, archived: false } },
        { upsert: true }
      );
    } catch (err) {
      console.warn("Seed upsert error for", rec.name, err.message);
    }
  }
  console.log(`Seeded/Upserted ${records.length} items from CSV`);
}
