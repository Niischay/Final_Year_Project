const express = require('express');
const router = express.Router();
const { markAttendance } = require('../controllers/attendanceController');

// Student marks attendance by scanning QR
router.post("/mark", markAttendance);

module.exports = router;
