const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const geolib = require("geolib");

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

    // 2. Face Verification Logic
    const student = await User.findById(studentId);
    
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!student.faceEncoding || student.faceEncoding.length === 0) {
        return res.status(400).json({ message: "Face data not found. Please contact Admin." });
    }

    if (!faceDescriptor || faceDescriptor.length === 0) {
        return res.status(400).json({ message: "No face detected. Try again." });
    }

    const distance = getEuclideanDistance(student.faceEncoding, Object.values(faceDescriptor));
    
    // CHANGE 1: Determine if face is valid, but DO NOT return/block execution
    const isFaceValid = distance <= 0.5; 

    // 3. Existing Session & Location Logic
    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(400).json({ message: "Session expired or not found" });

    if (!session.isActive) {
      return res.status(400).json({ message: "Session has been ended by the teacher" });
    }

    const now = new Date();
    const sessionAge = (now - session.createdAt) / 1000;
    if (sessionAge > 300) return res.status(400).json({ message: "Session expired" });

    const distFromTeacher = geolib.getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: session.teacherLocation.latitude, longitude: session.teacherLocation.longitude }
    );

    const isLocationValid = distFromTeacher <= 50; 

    const alreadyMarked = await Attendance.findOne({ user: studentId, sessionId });
    if (alreadyMarked) return res.status(400).json({ message: "Attendance already marked" });

    // CHANGE 2: Determine if the record should be flagged
    // It is flagged if EITHER location is invalid OR face is invalid
    const shouldFlag = !isLocationValid || !isFaceValid;

    const newAttendance = new Attendance({
      user: studentId,
      className: session.className,
      subjectName: session.subjectName,
      sessionId,
      location,
      locationValid: isLocationValid,
      faceVerified: isFaceValid, // Saves false if face match failed
      flagged: shouldFlag        // True if either check failed
    });

    await newAttendance.save();

    // CHANGE 3: Return appropriate message based on flag status
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

// ... (Rest of the controller functions: getFlaggedAttendances, etc. remain unchanged)
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
  
  const ExcelJS = require("exceljs");
  
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
  
      // Dynamic metadata
      const sessionDate = session.createdAt.toLocaleDateString();
      const periodNumber = session.periodNumber || 'N/A'; 
  
      worksheet.addRow(['Date', sessionDate]);
      worksheet.addRow(['Period Number', periodNumber]);
      worksheet.addRow(['Subject', session.subjectName]);
      worksheet.addRow([]); // Blank row
  
      // Header row
      worksheet.addRow(['Register Number']);
  
      // Add flagged students dynamically
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
      // You might also want to set faceVerified = true here if the teacher manually approves it
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