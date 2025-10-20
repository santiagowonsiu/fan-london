import mongoose from "mongoose";
import { Item } from "./models/Item.js";
import { Type } from "./models/Type.js";
import dotenv from "dotenv";

dotenv.config();

// Type normalization mapping
const TYPE_MAPPING = {
  "JAPANASE PRODUCT": "JAPANESE PRODUCT",
  "PERUVIAN PRODUCTS": "PERUVIAN PRODUCT",
  "SPICES SEASONINGS": "SPICES & SEASONINGS",
  "SUSHI BAR EQP": "SUSHI BAR EQUIPMENT",
  "CLEANING SUPPLIES": "CLEANING SUPPLIES",
  "ASIAN PRODUCT": "ASIAN PRODUCT",
  "CHINESE PRODUCT": "CHINESE PRODUCT",
  "ITALIAN PRODUCT": "ITALIAN PRODUCT",
  "KOREAN PRODUCT": "KOREAN PRODUCT",
  "PERUVIAN PRODUCT": "PERUVIAN PRODUCT",
  "JAPANESE PRODUCT": "JAPANESE PRODUCT",
  "BAR": "BAR",
  "CHEESE": "CHEESE",
  "DAIRY": "DAIRY",
  "EGG": "EGG",
  "FAMILY MEAL": "FAMILY MEAL",
  "FISH": "FISH",
  "FOH": "FOH",
  "FRUIT": "FRUIT",
  "ICE": "ICE",
  "MEAT": "MEAT",
  "NUTS": "NUTS",
  "OIL": "OIL",
  "PANTRY ITEMS": "PANTRY ITEMS",
  "PASTRY": "PASTRY",
  "PPE": "PPE",
  "RICE": "RICE",
  "SAUCES": "SAUCES",
  "SEAFOOD": "SEAFOOD",
  "SUPPLIES": "SUPPLIES",
  "VEGETABLE": "VEGETABLE",
  "VINEGAR": "VINEGAR"
};

async function migrateTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "inventory" });
    console.log("Connected to MongoDB");

    // Step 1: Create normalized types
    console.log("Creating normalized types...");
    const normalizedTypes = [...new Set(Object.values(TYPE_MAPPING))];
    
    for (const typeName of normalizedTypes) {
      await Type.findOneAndUpdate(
        { name: typeName },
        { name: typeName },
        { upsert: true, new: true }
      );
    }

    // Step 2: Update items to reference types
    console.log("Updating items to reference types...");
    const items = await Item.find({});
    
    for (const item of items) {
      const normalizedType = TYPE_MAPPING[item.type] || item.type;
      const typeDoc = await Type.findOne({ name: normalizedType });
      
      if (typeDoc) {
        await Item.findByIdAndUpdate(item._id, { 
          typeId: typeDoc._id,
          type: normalizedType // Keep for backward compatibility
        });
        console.log(`Updated item: ${item.name} -> ${normalizedType}`);
      }
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateTypes();
