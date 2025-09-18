const express = require("express");
const router = express.Router();
const Log = require("../models/Log");

// Save log
router.post("/", async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get logs
router.get("/", async (req, res) => {
  const logs = await Log.find();
  res.json(logs);
});

module.exports = router;
