const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  className: { type: String, required: true },
  subjectName: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  periodNumber: { type: Number, required: true },
  teacherLocation: {     
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { type: Date, default: Date.now, expires: 300 }
});

module.exports = mongoose.model("Session", sessionSchema);
