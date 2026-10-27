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
const port = Number(process.env.PORT) || 5000;

const startServer = (serverPort) => {
  const currentPort = Number(serverPort) || 5000;
  const server = app.listen(currentPort);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${currentPort} is already in use. Stop the other process or set PORT to a free port.`);
      process.exit(1);
      return;
    }

    console.error("Server startup error:", error);
    process.exit(1);
  });

  server.on("listening", () => {
    console.log(`✅ Server listening on port ${currentPort}`);
  });
};

const configuredOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "").split(",")
].filter((origin) => origin?.trim()).map((origin) => {
  try {
    const url = new URL(origin.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Client origin must use HTTP or HTTPS");
    }
    return url.origin;
  } catch (error) {
    console.warn(`Ignoring invalid client origin "${origin}": ${error.message}`);
    return null;
  }
}).filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://automated-book-recommendation.vercel.app",
  ...configuredOrigins
]);

const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const corsOptions = {
  origin(origin, callback) {
    // Disallowed origins get no CORS headers (browser blocks them) instead of a 500 error.
    callback(null, !origin || allowedOrigins.has(origin) || localOriginPattern.test(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true, service: "Book Recommendation API" }));

const fallbackBooks = [
  { title: "Clean Code", author: "Robert C. Martin", publisher: "Prentice Hall", isbn13: "9780132350884" },
  { title: "Database System Concepts", author: "Abraham Silberschatz", publisher: "McGraw Hill", isbn13: "9780073523323" },
  { title: "Computer Networks", author: "Andrew S. Tanenbaum", publisher: "Pearson", isbn13: "9780132126953" },
  { title: "Operating System Concepts", author: "Abraham Silberschatz", publisher: "Wiley", isbn13: "9781118063330" },
  { title: "Design Patterns", author: "Erich Gamma", publisher: "Addison-Wesley", isbn13: "9780201633610" },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", publisher: "MIT Press", isbn13: "9780262033848" },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", publisher: "Pearson", isbn13: "9780134610993" },
  { title: "Software Engineering", author: "Ian Sommerville", publisher: "Pearson", isbn13: "9780133943030" },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", publisher: "Addison-Wesley", isbn13: "9780201616224" }
];

function buildFallbackSuggestion(query, field) {
  const cleaned = String(query || "").trim();
  if (!cleaned) {
    return [];
  }

  const needle = cleaned.toLowerCase();
  return fallbackBooks.filter((book) => {
    const candidates = [book.title, book.author, book.publisher];
    return candidates.some((value) => value.toLowerCase().includes(needle));
  }).slice(0, 5).map((book) => ({ ...book, isbn10: "", source: "local" }));
}

app.post("/api/ai/book-suggestion", async (req, res) => {
  const query = String(req.body?.query || "").trim();
  const requestedField = String(req.body?.field || "title").trim();
  const field = ["title", "author", "publisher"].includes(requestedField) ? requestedField : "title";

  if (!query) {
    return res.status(400).json({ message: "Please type a book title, author, or publisher before asking for a suggestion." });
  }

  try {
    const params = new URLSearchParams({
      q: `${field}:${query.slice(0, 150)}`,
      limit: "5",
      fields: "title,author_name,publisher,isbn"
    });
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Book catalog search is temporarily unavailable");
    }

    const suggestions = (data.docs || []).map((book) => {
      const isbns = Array.isArray(book.isbn) ? book.isbn : [];
      return {
        title: book.title || "",
        author: Array.isArray(book.author_name) ? book.author_name.join(", ") : "",
        publisher: Array.isArray(book.publisher) ? book.publisher[0] || "" : "",
        isbn13: isbns.find((isbn) => /^(978|979)\d{10}$/.test(isbn)) || "",
        isbn10: isbns.find((isbn) => /^\d{9}[\dX]$/.test(isbn)) || "",
        source: "openlibrary"
      };
    }).filter((book) => book.title);

    return res.json({ suggestions, source: "openlibrary" });
  } catch (error) {
    return res.json({
      suggestions: buildFallbackSuggestion(query, field),
      source: "local",
      warning: "Online book search is unavailable; showing matching built-in titles instead."
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/order-periods", orderPeriodRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/admin/users", userRoutes);

app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }

  if (error.code === "CORS_ORIGIN_BLOCKED") {
    return res.status(403).json({ message: "This origin is not allowed by CORS." });
  }

  console.error("Unhandled request error:", error);
  return res.status(500).json({ message: "Internal server error." });
});

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
  startServer(port);
})
.catch((err) => {
  console.error("❌ MongoDB Connection Error:", err.message);
  process.exit(1);
});
