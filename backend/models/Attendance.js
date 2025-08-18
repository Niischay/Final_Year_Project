
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Links to student
    required: true,
  },
  className: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    required: true, // UUID or timestamp hash from QR code
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  location: {
    latitude: Number,
    longitude: Number,
  },
  locationValid: {
    type: Boolean,
    default: false,
  },
  faceMatchScore: {
    type: Number,
    default: 0,
  },
  faceVerified: {
    type: Boolean,
    default: false,
  },
  flagged: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
