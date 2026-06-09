import dns from "node:dns";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import orderPeriodRoutes from "./routes/orderPeriods.js";
import recommendationRoutes from "./routes/recommendations.js";
import statsRoutes from "./routes/stats.js";
import userRoutes from "./routes/userRoutes.js";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();
if (!process.env.MONGO_URI) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.join(dir, "../.env") });
  dotenv.config({ path: path.join(dir, "../../.env") });
}

export const tokenBlacklist = new Set();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true, service: "Book Recommendation API" }));

app.use("/api/auth", authRoutes);
app.use("/api/order-periods", orderPeriodRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin/users", userRoutes);

mongoose.connect(process.env.MONGO_URI, {
  retryWrites: true,
  w: "majority",
  serverSelectionTimeoutMS: 20000,
  socketTimeoutMS: 60000,
  family: 4,
  connectTimeoutMS: 20000,
})
.then(() => {
  console.log("✅ Connected to MongoDB Atlas");
  app.listen(port, () => console.log(`✅ API running on port ${port}`));
})
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
});
