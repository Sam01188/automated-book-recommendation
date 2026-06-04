import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import recommendationRoutes from "./routes/recommendations.js";
import statsRoutes from "./routes/stats.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.MONGO_URI) {
  // attempt to load server/.env and repo root .env if MONGO_URI not already set
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
  dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
}

// Token blacklist for logout functionality
export const tokenBlacklist = new Set();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Book Recommendation API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin/users", userRoutes);

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to connect to MongoDB", error.message);
    process.exit(1);
  }
}

start();
