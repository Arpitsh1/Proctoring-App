import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

let eventLogs = [];

app.post("/log", (req, res) => {
  const { message } = req.body;
  if (message) {
    const logEntry = { message, time: new Date().toISOString() };
    eventLogs.push(logEntry);
    console.log("Log:", logEntry);
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false, error: "No message provided" });
  }
});

app.get("/logs", (req, res) => {
  res.json(eventLogs);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
