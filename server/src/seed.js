import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/user.js";
import Recommendation from "./models/Recommendation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

// 👤 USERS
const users = [
  ["System Admin", "admin@ruh.ac.lk", "admin123", "admin"],
  ["Menaka Samaranayake", "menaka@ruh.ac.lk", "lecturer123", "lecturer"],
  ["Sameera Rathnayake", "sameera@ruh.ac.lk", "hod123", "hod"],
  ["Senaka Aluthge", "senaka@ruh.ac.lk", "library123", "librarian"]
];

// 📚 SAMPLE BOOK RECOMMENDATIONS
const books = [
  ["Clean Code", "Robert C. Martin", "Prentice Hall", "high"],
  ["Design Patterns", "Erich Gamma", "Addison-Wesley", "medium"],
  ["Database System Concepts", "Silberschatz", "McGraw Hill", "high"],
  ["Computer Networks", "Andrew S. Tanenbaum", "Pearson", "medium"],
  ["Operating System Concepts", "Abraham Silberschatz", "Wiley", "low"]
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🔗 Connected to MongoDB");

    // 🧹 Clean existing data
    await User.deleteMany({});
    await Recommendation.deleteMany({});

    console.log("🧹 Old data cleared");

    // 👤 Create users
    const createdUsers = [];

    for (const [name, email, password, role] of users) {
      const user = await User.create({
        name,
        email,
        role,
        ...(role !== "admin" && role !== "librarian" ? { department: "DCEE" } : {}),
        passwordHash: await bcrypt.hash(password, 10)
      });

      createdUsers.push(user);
    }

    console.log("👥 Users seeded");

    // 📚 Create recommendations
    for (const [title, author, publisher, priority] of books) {
      await Recommendation.create({
        title,
        author,
        isbn: "9780000000000",
        publisher,
        edition: "Latest",
        additionalNotes: "Seeded recommendation",
        submittedBy: createdUsers.find(u => u.role === "lecturer")._id,
        department: "DCEE",
        status: priority === "high" ? "approved" : "under_review",
        priority
      });
    }

    console.log("📚 Recommendations seeded");

    // 🧾 Output login credentials
    console.log("\n✅ SEED COMPLETE");
    console.table(
      users.map(([name, email, password, role]) => ({
        name,
        email,
        password,
        role
      }))
    );

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();