const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const Session = require("../models/Session");  

exports.createSession = async (req, res) => {
  try {
    const { className, subjectName, teacherLocation } = req.body;

    if (!className || !subjectName || !teacherLocation) {
      return res.status(400).json({ message: "className, subjectName and teacherLocation are required" });
    }

    // Generate unique sessionId
    const sessionId = uuidv4();

    // Save session in DB
    const newSession = new Session({ 
      className, 
      subjectName, 
      sessionId,
      teacherLocation
     });
    await newSession.save();

    // Generate QR code (contains sessionId)
    const qrData = { sessionId, className, subjectName };
    const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));

    res.status(201).json({
      message: "QR Session created successfully",
      sessionId,
      qrImage
    });

  } catch (error) {
    console.error("❌ QR Session Error:", error);
    res.status(500).json({ message: "Error creating QR session" });
  }
};
