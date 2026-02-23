const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const User = require("../models/User");
const Class = require("../models/Class"); // <--- IMPORT THIS
const jwt = require("jsonwebtoken");
const geolib = require("geolib");
const ExcelJS = require("exceljs");

// Helper function to calculate Euclidean Distance
const getEuclideanDistance = (face1, face2) => {
  if (!face1 || !face2 || face1.length !== face2.length) return 1.0; 
  return Math.sqrt(
    face1
      .map((val, i) => Math.pow(val - face2[i], 2))
      .reduce((sum, sq) => sum + sq, 0)
  );
};

exports.markAttendance = async (req, res) => {
  try {
    // 1. Extract Data
    const { sessionId, location, faceDescriptor } = req.body; 
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.id;

    // 2. Fetch Student & Session
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(400).json({ message: "Session expired or not found" });

    // --- NEW: Class Verification Logic ---
    // Find the Class document based on the session's class name
    const classObj = await Class.findOne({ className: session.className });
    
    // Check if the student is linked to this class
    if (classObj) {
       // We assume student.studentClass is an ObjectId referencing the Class model
       if (!student.studentClass || !student.studentClass.equals(classObj._id)) {
           return res.status(403).json({ message: `You are not enrolled in Class: ${session.className}` });
       }
    }
    // -------------------------------------

    // 3. Standard Checks
    if (!student.faceEncoding || student.faceEncoding.length === 0) {
        return res.status(400).json({ message: "Face data not found. Please contact Admin." });
    }

    if (!faceDescriptor || faceDescriptor.length === 0) {
        return res.status(400).json({ message: "No face detected. Try again." });
    }

    if (!session.isActive) {
      return res.status(400).json({ message: "Session has been ended by the teacher" });
    }

    // Check Session Expiry (5 mins)
    const now = new Date();
    const sessionAge = (now - session.createdAt) / 1000;
    if (sessionAge > 300) return res.status(400).json({ message: "Session expired" });

    // 4. Verification Logic
    const distance = getEuclideanDistance(student.faceEncoding, Object.values(faceDescriptor));
    const isFaceValid = distance <= 0.5; 

    const distFromTeacher = geolib.getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: session.teacherLocation.latitude, longitude: session.teacherLocation.longitude }
    );

    const isLocationValid = distFromTeacher <= 50; 

    // Check for duplicate
    const alreadyMarked = await Attendance.findOne({ user: studentId, sessionId });
    if (alreadyMarked) return res.status(400).json({ message: "Attendance already marked" });

    // Flag logic: Flag if EITHER location is invalid OR face is invalid
    const shouldFlag = !isLocationValid || !isFaceValid;

    const newAttendance = new Attendance({
      user: studentId,
      className: session.className,
      subjectName: session.subjectName,
      sessionId,
      location,
      locationValid: isLocationValid,
      faceVerified: isFaceValid, 
      flagged: shouldFlag
    });

    await newAttendance.save();

    // Return message based on flag status
    if (shouldFlag) {
        let reason = [];
        if (!isFaceValid) reason.push("Face Mismatch");
        if (!isLocationValid) reason.push("Invalid Location");

        return res.status(201).json({
            message: `Attendance flagged for verification: ${reason.join(" & ")}`
        });
    }

    res.status(201).json({
      message: "Attendance marked successfully! (Face & Location Verified)"
    });

  } catch (error) {
    console.error("❌ Mark Attendance Error:", error);
    res.status(500).json({ message: "Server error marking attendance" });
  }
};

exports.getFlaggedAttendances = async (req, res) => {
    try {
      const { sessionId } = req.params;
  
      const flaggedRecords = await Attendance.find({
        sessionId,
        flagged: true
      }).populate('user', 'registerNumber email role'); 
  
      res.status(200).json({
        message: "Flagged attendances fetched successfully",
        flaggedAttendances: flaggedRecords
      });
    } catch (error) {
      console.error("❌ Get Flagged Attendance Error:", error);
      res.status(500).json({ message: "Server error fetching flagged attendance" });
    }
};
  
// --- UPDATED EXPORT FUNCTION (No Reason/Time) ---
exports.exportFlaggedAttendances = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const flaggedRecords = await Attendance.find({
      sessionId,
      flagged: true
    }).populate('user', 'registerNumber');

    if (!flaggedRecords.length) {
      return res.status(404).json({ message: "No flagged attendances found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Flagged Attendance');

    // Metadata
    const sessionDate = session.createdAt.toLocaleDateString();
    
    worksheet.addRow(['Date', sessionDate]);
    worksheet.addRow(['Class', session.className]);
    worksheet.addRow(['Subject', session.subjectName]);
    worksheet.addRow([]); // Blank row

    // Header row - SIMPLIFIED
    worksheet.addRow(['Register Number']);

    // Add flagged students - ONLY Register Number
    flaggedRecords.forEach(record => {
      worksheet.addRow([record.user.registerNumber]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=flagged_attendance_${sessionId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Export Excel Error:", error);
    res.status(500).json({ message: "Server error exporting flagged attendances" });
  }
};

exports.approveAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;

    const attendanceRecord = await Attendance.findById(attendanceId);

    if (!attendanceRecord) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    attendanceRecord.flagged = false;
    attendanceRecord.locationValid = true; 
    attendanceRecord.faceVerified = true; 
    
    await attendanceRecord.save();

    res.status(200).json({
      message: "Attendance approved successfully",
      record: attendanceRecord
    });

  } catch (error) {
    console.error("❌ Approve Attendance Error:", error);
    res.status(500).json({ message: "Server error approving attendance" });
  }
};