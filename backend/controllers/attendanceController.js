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
