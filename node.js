// Backend: Express + SQLite + JWT
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "storedatadb.db");

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => console.log("\u2705 Server Running at http://localhost:3000/"));
  } catch (e) {
    console.log(`\u274C DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const jwtToken = authHeader?.split(" ")[1];

  if (!jwtToken) return res.status(401).send({ error: "Invalid JWT Token" });

  jwt.verify(jwtToken, "MY_SECRET_TOKEN", (error, payload) => {
    if (error) return res.status(401).send({ error: "Invalid JWT Token" });
    req.username = payload.username;
    req.userId = payload.userId;
    req.role = payload.role;
    next();
  });
};

// Register API
app.post("/register", async (req, res) => {
  const { name, email, password, address, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await db.get("SELECT * FROM users WHERE name = ?", [name]);
  if (existingUser) return res.status(400).send({ error: "User already exists" });

  const result = await db.run(
    "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)",
    [name, email, hashedPassword, address, role]
  );
  res.send({ message: "User created", userId: result.lastID });
});

// Login API
app.post("/login", async (req, res) => {
  const { name, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE name = ?", [name]);
  if (!user) return res.status(400).send({ error: "Invalid User" });

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).send({ error: "Invalid Password" });

  const token = jwt.sign(
    { username: user.name, userId: user.id, role: user.role },
    "MY_SECRET_TOKEN"
  );
  res.send({ jwtToken: token });
});

// Add Store (Store Owner)
app.post("/stores/add", authenticateToken, async (req, res) => {
  const { name, address } = req.body;
  if (req.role !== "store_owner") return res.status(403).send({ error: "Only store owners can add store" });

  const existing = await db.get("SELECT * FROM stores WHERE owner_id = ?", [req.userId]);
  if (existing) return res.status(400).send({ error: "Store already exists" });

  await db.run("INSERT INTO stores (name, address, owner_id) VALUES (?, ?, ?)", [name, address, req.userId]);
  res.send({ message: "Store added successfully" });
});

// Update Store (Store Owner)
app.put("/stores/update", authenticateToken, async (req, res) => {
  const { name, address } = req.body;
  if (req.role !== "store_owner") return res.status(403).send({ error: "Only store owners can update store" });

  const existing = await db.get("SELECT * FROM stores WHERE owner_id = ?", [req.userId]);
  if (!existing) return res.status(404).send({ error: "Store not found to update" });

  await db.run("UPDATE stores SET name = ?, address = ? WHERE owner_id = ?", [name, address, req.userId]);
  res.send({ message: "Store updated successfully" });
});

// Store Owner Dashboard
app.get("/dashboard/owner", authenticateToken, async (req, res) => {
  if (req.role !== "store-owner") return res.status(403).send({ error: "Access denied" });

  const store = await db.get("SELECT id FROM stores WHERE owner_id = ?", [req.userId]);
  if (!store) return res.status(404).send({ error: "Store not found" });

  const ratings = await db.all(`
    SELECT user_id AS userId, name AS username, rating_value AS rating
    FROM ratings JOIN users ON ratings.user_id = users.id
    WHERE ratings.store_id = ?`, [store.id]);

  const avg = await db.get("SELECT AVG(rating_value) AS averageRating FROM ratings WHERE store_id = ?", [store.id]);
  res.send({ ratings, averageRating: avg?.averageRating ? Number(avg.averageRating).toFixed(1) : 0 });
});

// Admin Dashboard
app.get("/dashboard/admin", authenticateToken, async (req, res) => {
  const users = await db.all("SELECT * FROM users");
  const stores = await db.all("SELECT * FROM stores");
  const totalUsers = await db.get("SELECT COUNT(*) AS totalUsers FROM users");
  const totalStores = await db.get("SELECT COUNT(*) AS totalStores FROM stores");
  const totalRatings = await db.get("SELECT COUNT(rating_value) AS totalRatings FROM ratings");

  res.send({ users, stores, totalUsers, totalStores, totalRatings });
});

// User Dashboard
app.get("/dashboard/user", authenticateToken, async (req, res) => {
  try {
    const stores = await db.all(`
      SELECT stores.*, 
      (SELECT rating_value FROM ratings WHERE ratings.user_id = ? AND ratings.store_id = stores.id) AS user_rating,
      (SELECT AVG(rating_value) FROM ratings WHERE store_id = stores.id) AS rating_value,
      users.name AS owner_name
      FROM stores
      JOIN users ON stores.owner_id = users.id
    `, [req.userId]);

    if (stores.length === 0) return res.status(404).send({ error: "No stores found" });
    res.send(stores);
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Submit or Update Rating
app.put("/dashboard/user/rating", authenticateToken, async (req, res) => {
  try {
    const { storeId, rating } = req.body;
    const existingRating = await db.get("SELECT * FROM ratings WHERE user_id = ? AND store_id = ?", [req.userId, storeId]);

    if (existingRating) {
      await db.run("UPDATE ratings SET rating_value = ? WHERE id = ?", [rating, existingRating.id]);
    } else {
      await db.run("INSERT INTO ratings (user_id, store_id, rating_value) VALUES (?, ?, ?)", [req.userId, storeId, rating]);
    }

    const avg = await db.get("SELECT AVG(rating_value) AS average_rating FROM ratings WHERE store_id = ?", [storeId]);
    res.send({ message: "Rating submitted", average_rating: Number(avg.average_rating).toFixed(1), user_rating: rating });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

// Get Logged-in User Profile
app.get("/profile", authenticateToken, async (req, res) => {
  const { username, userId, role } = req;
  res.send({ username, userId, role });
});
