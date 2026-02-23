const express = require('express');
const router = express.Router();
// Import the new controller function
const { addUser, uploadFaceData } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/add-user', protect, admin, addUser);
// Add this new line:
router.post('/upload-face', protect, admin, uploadFaceData);

module.exports = router;