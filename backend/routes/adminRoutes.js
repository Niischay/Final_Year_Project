const express = require('express');
const router = express.Router();
const { addUser, uploadFaceData } = require('../controllers/adminController');

const { protect, admin } = require('../middleware/authMiddleware');

// Protect ensures valid token, Admin ensures role is 'admin'
router.post('/add-user', protect, admin, addUser);

router.post('/upload-face', protect, admin, uploadFaceData);

module.exports = router;