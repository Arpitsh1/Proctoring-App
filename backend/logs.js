import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  event: String,
  timestamp: Date,
});

export default mongoose.model("Log", logSchema);
