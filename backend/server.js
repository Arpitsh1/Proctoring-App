import express from "express";
import http from "http";
import { WebSocketServer } from "ws";   // ⬅️ FIXED
import mongoose from "mongoose";

// --------------------
// 1. Connect to MongoDB
// --------------------
mongoose.connect("mongodb://127.0.0.1:27017/proctoring", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const logSchema = new mongoose.Schema({
  candidateName: String,
  duration: Number,
  absence: Number,
  lookingAway: Number,
  phone: Number,
  book: Number,
  integrityScore: Number,
  createdAt: { type: Date, default: Date.now },
});

const Log = mongoose.model("Log", logSchema);

// --------------------
// 2. Setup Express + HTTP server
// --------------------
const app = express();
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

app.get("/logs", async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// 3. WebSocket server
// --------------------
const wss = new WebSocketServer({ server });   // ⬅️ FIXED

wss.on("connection", (ws) => {
  console.log("Frontend connected ✅");

  ws.on("message", async (msg) => {
    console.log("Received:", msg.toString());
    try {
      const data = JSON.parse(msg.toString());
      const log = new Log(data);
      await log.save();
      console.log("Log saved to DB ✅");
    } catch (err) {
      console.error("Error saving log:", err.message);
    }
  });
});

// --------------------
// 4. Start server
// --------------------
server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
  console.log("📡 WebSocket listening on ws://localhost:5000");
});
