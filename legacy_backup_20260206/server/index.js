import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const WEB_ROOT = path.join(__dirname, "..");
app.use(express.static(WEB_ROOT));

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  next();
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const db = await getDb();
    const users = db.collection("users");
    const uname = username.trim().toLowerCase();
    const existing = await users.findOne({ username: uname });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const adminUser = (process.env.ADMIN_USERNAME || "").toLowerCase();
    const role = uname === adminUser ? "admin" : "user";
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      username: uname,
      passwordHash,
      role,
      createdAt: new Date()
    };
    const result = await users.insertOne(user);

    const token = jwt.sign({ uid: result.insertedId.toString(), username: user.username, role: user.role }, getJwtSecret(), { expiresIn: "30d" });
    await db.collection("progress").insertOne({
      userId: result.insertedId.toString(),
      knownIds: [],
      testHistory: [],
      lastWrongIds: [],
      updatedAt: new Date()
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    await users.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
    const token = jwt.sign({ uid: user._id.toString(), username: user.username, role: user.role || "user" }, getJwtSecret(), { expiresIn: "30d" });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/me", authMiddleware, async (req, res) => {
  res.json({ username: req.user.username, role: req.user.role || "user" });
});

app.get("/api/vocab", authMiddleware, async (req, res) => {
  try {
    const dataset = (req.query.dataset || "all").toString();
    const db = await getDb();
    const vocab = db.collection("vocab");

    const query = dataset === "all" ? {} : { dataset };
    const items = await vocab.find(query).project({ _id: 0 }).toArray();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tests", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const tests = db.collection("tests");
    const items = await tests.find({}).project({ _id: 0 }).toArray();
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/progress", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const progress = db.collection("progress");
    const p = await progress.findOne({ userId: req.user.uid });
    res.json(p || { knownIds: [], testHistory: [], lastWrongIds: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/progress", authMiddleware, async (req, res) => {
  try {
    const { knownIds, testHistory, lastWrongIds } = req.body || {};
    const db = await getDb();
    const progress = db.collection("progress");
    await progress.updateOne(
      { userId: req.user.uid },
      {
        $set: {
          knownIds: Array.isArray(knownIds) ? knownIds : [],
          testHistory: Array.isArray(testHistory) ? testHistory.slice(0, 20) : [],
          lastWrongIds: Array.isArray(lastWrongIds) ? lastWrongIds : [],
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(WEB_ROOT, "guest.html"));
});

app.get(["/dashboard", "/login", "/register"], (req, res) => {
  res.sendFile(path.join(WEB_ROOT, "index.html"));
});

// Fallback to guest landing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(WEB_ROOT, "guest.html"));
});

app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection("users").find({}).project({ passwordHash: 0 }).toArray();
    const progressMap = new Map();
    const progress = await db.collection("progress").find({}).toArray();
    for (const p of progress) progressMap.set(p.userId, p);

    const rows = users.map((u) => {
      const p = progressMap.get(u._id.toString());
      return {
        id: u._id.toString(),
        username: u.username,
        role: u.role || "user",
        createdAt: u.createdAt,
        lastLogin: u.lastLogin || null,
        knownCount: Array.isArray(p?.knownIds) ? p.knownIds.length : 0,
        testsCount: Array.isArray(p?.testHistory) ? p.testHistory.length : 0,
      };
    });
    res.json({ users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
