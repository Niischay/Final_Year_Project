const express = require("express");
const router = express.Router();
const { createSession, endSession } = require("../controllers/qrController");

// Teacher creates QR session
router.post("/create", createSession);

router.post("/end/:sessionId", endSession);

module.exports = router;
