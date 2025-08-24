const express = require("express");
const router = express.Router();
const { createSession } = require("../controllers/qrController");

// Teacher creates QR session
router.post("/create", createSession);

module.exports = router;
