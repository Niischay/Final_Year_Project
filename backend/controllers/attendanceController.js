const Attendance = require("../models/Attendance");
const Session = require("../models/Session");
const jwt = require("jsonwebtoken");
const geolib = require("geolib");

exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, location } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const studentId = decoded.id;

    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(400).json({ message: "Session expired or not found" });

    const now = new Date();
    const sessionAge = (now - session.createdAt) / 1000;
    if (sessionAge > 300) return res.status(400).json({ message: "Session expired" });

    const distance = geolib.getDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: session.teacherLocation.latitude, longitude: session.teacherLocation.longitude }
    );

    const locationValid = distance <= 20;  // within 20 meters

    const alreadyMarked = await Attendance.findOne({ user: studentId, sessionId });
    if (alreadyMarked) return res.status(400).json({ message: "Attendance already marked" });

    if (!locationValid) {
      // ⚠️ Don’t save as valid attendance, but flag for teacher review
      const flaggedAttendance = new Attendance({
        user: studentId,
        className: session.className,
        subjectName: session.subjectName,
        sessionId,
        location,
        locationValid: false,
        flagged: true
      });

      await flaggedAttendance.save();

      return res.status(201).json({
        message: "Location invalid — attendance flagged for teacher review"
      });
    }

    // Valid attendance → Save normally
    const newAttendance = new Attendance({
      user: studentId,
      className: session.className,
      subjectName: session.subjectName,
      sessionId,
      location,
      locationValid: true,
      flagged: false
    });

    await newAttendance.save();

    res.status(201).json({
      message: "Attendance marked successfully"
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
    }).populate('user', 'registerNumber email role');  // Pull student info

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
    const periodNumber = session.periodNumber || 'N/A';  // Make sure you store this in session when created

    worksheet.addRow(['Date', sessionDate]);
    worksheet.addRow(['Period Number', periodNumber]);
    worksheet.addRow(['Subject', session.subjectName]);
    worksheet.addRow([]);  // Blank row

    // Header row
    worksheet.addRow(['Register Number']);

    // Add flagged students dynamically
    flaggedRecords.forEach(record => {
      worksheet.addRow([record.user.registerNumber]);
    });

    // Set headers for file download
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
