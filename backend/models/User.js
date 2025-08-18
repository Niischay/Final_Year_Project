const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['student', 'teacher'],
    required: true,
  },
  registerNumber: {
    type: String,
    required: function () {
      return this.role === 'student';
    },
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: function () {
      return this.role === 'teacher';
    },
    unique: true,
    sparse: true,
  },
  registeredLocation: {
    latitude: Number,
    longitude: Number,
  },
  faceEncoding: {
    type: [Number],
    default: [],
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
