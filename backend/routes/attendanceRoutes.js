const express = require('express');
const router = express.Router();
const { markAttendance, getFlaggedAttendances, exportFlaggedAttendances, approveAttendance} = require('../controllers/attendanceController');

// Student marks attendance by scanning QR
router.post("/mark", markAttendance);

router.get("/flagged/:sessionId", getFlaggedAttendances);

router.get("/export/:sessionId", exportFlaggedAttendances);

router.put("/approve/:attendanceId", approveAttendance);

module.exports = router;
