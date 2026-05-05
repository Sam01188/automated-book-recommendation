import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Recommendation from "./models/Recommendation.js";
import User from "./models/User.js";

dotenv.config();

const users = [
  ["Menaka Samaranayake", "lecturer", "lecturer123", "lecturer"],
  ["Sameera Rathnayake", "hod", "hod123", "hod"],
  ["Senaka Aluthge", "librarian", "library123", "librarian"]
];

const books = [
  ["Clean Code", "Robert C. Martin", "Prentice Hall", "high"],
  ["Design Patterns", "Erich Gamma", "Addison-Wesley", "medium"],
  ["Database System Concepts", "Silberschatz", "McGraw Hill", "high"],
  ["Computer Networks", "Andrew S. Tanenbaum", "Pearson", "medium"],
  ["Operating System Concepts", "Abraham Silberschatz", "Wiley", "low"]
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/book_recommendation_system");
  await User.deleteMany({});
  await Recommendation.deleteMany({});

  const created = [];
  for (const [name, username, password, role] of users) {
    created.push(
      await User.create({
        name,
        username,
        role,
        department: "DCEE",
        passwordHash: await bcrypt.hash(password, 10)
      })
    );
  }

  for (const [title, author, publisher, priority] of books) {
    await Recommendation.create({
      title,
      author,
      isbn: "9780000000000",
      publisher,
      edition: "Latest",
      additionalNotes: "Recommended for engineering reference collection.",
      submittedBy: created[0]._id,
      department: "DCEE",
      status: priority === "high" ? "approved" : "under_review",
      priority
    });
  }

  console.log("Seed complete");
  console.table(users.map(([, username, password, role]) => ({ username, password, role })));
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
