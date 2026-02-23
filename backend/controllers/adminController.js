const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Add a new user (Student or Teacher)
// @route   POST /api/admin/add-user
// @access  Private/Admin
exports.addUser = async (req, res) => {
  try {
    const { role, registerNumber, email, password } = req.body;

    // Basic Validation
    if (!password || !role) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    // Check if user already exists
    // We check both email and registerNumber depending on what was provided
    const query = [];
    if (email) query.push({ email });
    if (registerNumber) query.push({ registerNumber });
    
    if (query.length > 0) {
        const existingUser = await User.findOne({ $or: query });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists (Email or Register Number)' });
        }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      role,
      registerNumber: role === 'student' ? registerNumber : undefined,
      email: (role === 'teacher' || role === 'admin') ? email : undefined,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: `${role} added successfully` });

  } catch (error) {
    console.error("❌ Add User Error:", error);
    res.status(500).json({ message: "Server error adding user" });
  }
};

// @desc    Upload face embedding for a student
// @route   POST /api/admin/upload-face
// @access  Private/Admin
exports.uploadFaceData = async (req, res) => {
  try {
    const { registerNumber, faceEncoding } = req.body;

    if (!registerNumber || !faceEncoding) {
      return res.status(400).json({ message: "Register number and face data are required" });
    }

    // Find the student
    const student = await User.findOne({ registerNumber, role: 'student' });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update their face encoding
    student.faceEncoding = faceEncoding;
    await student.save();

    res.status(200).json({ message: "Face data updated successfully" });

  } catch (error) {
    console.error("❌ Upload Face Error:", error);
    res.status(500).json({ message: "Server error updating face data" });
  }
};