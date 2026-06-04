import dns, { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

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
    console.log("🔄 Connecting to MongoDB Atlas...");
    console.log("URI:", process.env.MONGO_URI?.replace(/:(.*?)@/, ":****@"));
    
    await mongoose.connect(process.env.MONGO_URI, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 60000,
      family: 4,
      connectTimeoutMS: 20000,
    });
    
    console.log("✅ Connected to MongoDB Atlas successfully");
    app.listen(port, () => {
      console.log(`✅ API running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("\n❌ MongoDB Connection Error:");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("\n📋 Troubleshooting Checklist:");
    console.error("1. Check MongoDB Atlas cluster status: https://cloud.mongodb.com");
    console.error("2. Verify IP whitelist includes: 0.0.0.0/0 (or your current IP)");
    console.error("3. Check database user password matches in Database Access section");
    console.error("4. Verify database name: book-recommendation exists");
    console.error("5. Try restarting your cluster if it appears paused or stuck");
    console.error("\n🔗 Connection String (masked):");
    console.error(process.env.MONGO_URI?.replace(/:(.*?)@/, ":****@"));
    process.exit(1);
  }
}

start();
