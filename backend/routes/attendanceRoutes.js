const express = require('express');
const router = express.Router();
const { registerUser, loginUser, markAttendance } = require('../controllers/attendanceController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/mark", markAttendance);

module.exports = router;
