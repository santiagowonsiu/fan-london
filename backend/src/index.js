import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { itemsRouter } from "./routes/items.js";
import { typesRouter } from "./routes/types.js";
import { seedFromCsvOnce } from "./seedCsv.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI is not set in environment");
  process.exit(1);
}

async function connectToDatabase() {
  try {
    await mongoose.connect(mongoUri, {
      dbName: "inventory",
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState; // 0=disconnected,1=connected,2=connecting,3=disconnecting
  res.json({ ok: true, dbState: state });
});

app.use("/api/items", itemsRouter);
app.use("/api/types", typesRouter);

const port = process.env.PORT || 4000;

connectToDatabase().then(async () => {
  await seedFromCsvOnce();
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
});
