const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const Session = require("../models/Session");
// --- NEW IMPORTS REQUIRED FOR AUTO-ABSENT LOGIC ---
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
// --------------------------------------------------

exports.createSession = async (req, res) => {
  try {
    const { className, subjectName, teacherLocation, periodNumber } = req.body;

    if (!className || !subjectName || !teacherLocation) {
      return res.status(400).json({ message: "className, subjectName, teacherLocation and periodNumber are required" });
    }

    // Generate unique sessionId
    const sessionId = uuidv4();

    // Save session in DB
    const newSession = new Session({ 
      className, 
      subjectName, 
      sessionId,
      teacherLocation,
      periodNumber,
      isActive: true
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

exports.endSession = async (req, res) => {
  try {
    // Note: User code uses req.params for sessionId
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!session.isActive) {
        return res.status(400).json({ message: "Session is already ended" });
    }

    // 1. Mark session as inactive
    session.isActive = false;
    await session.save();

    // ======================================================
    // 2. AUTO-ABSENT LOGIC
    // ======================================================
    
    // A. Find the class to get the list of enrolled students
    const classObj = await Class.findOne({ className: session.className });
    
    if (classObj && classObj.students.length > 0) {
        // B. Get IDs of students who have ALREADY marked attendance (valid or flagged)
        const existingAttendance = await Attendance.find({ sessionId }).select('user');
        
        // Convert existing IDs to strings for comparison
        const presentStudentIds = existingAttendance.map(a => a.user.toString());

        // C. Filter enrolled students who are NOT in the present list
        const absentStudents = classObj.students.filter(studentId => 
            !presentStudentIds.includes(studentId.toString())
        );

        // D. Create "Absent" records for them
        if (absentStudents.length > 0) {
            const absentRecords = absentStudents.map(studentId => ({
                user: studentId,
                className: session.className,
                subjectName: session.subjectName,
                sessionId: session.sessionId,
                location: { latitude: 0, longitude: 0 }, // No location data
                locationValid: false,
                faceVerified: false,
                flagged: true,   // IMPORTANT: This ensures they show up in your final list
                isAbsent: true   // Internal flag for "Absent"
            }));

            await Attendance.insertMany(absentRecords);
            console.log(`Marked ${absentRecords.length} students as absent.`);
        }
    }
    // ======================================================

    res.status(200).json({
      message: "Session ended and absentees marked successfully",
    });

  } catch (error) {
    console.error("❌ End Session Error:", error);
    res.status(500).json({ message: "Error ending session" });
  }
};