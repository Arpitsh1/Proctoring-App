import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  candidateName: String,
  type: String,
  timestamp: { type: Date, default: Date.now }
});

const Log = mongoose.model("Log", logSchema);

export default Log;   // ✅ ES module default export
