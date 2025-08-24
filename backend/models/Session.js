const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  className: { type: String, required: true },
  subjectName: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: "1h" }
});

module.exports = mongoose.model("Session", sessionSchema);
