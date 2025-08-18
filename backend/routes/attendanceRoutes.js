const express = require('express');
const router = express.Router();
const { registerStudent, loginStudent } = require('../controllers/attendanceController');

router.post('/register-student', registerStudent);
router.post('/login-student', loginStudent);

module.exports = router;
