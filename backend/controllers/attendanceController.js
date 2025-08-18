const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ Register user (student or teacher)
exports.registerUser = async (req, res) => {
  try {
    const { role, registerNumber, email, password } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // For students → registerNumber is required
    // For teachers → email is required
    const newUser = new User({
      role,
      registerNumber: role === 'student' ? registerNumber : undefined,
      email: role === 'teacher' ? email : undefined,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('❌ Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ✅ Login user
exports.loginUser = async (req, res) => {
  try {
    const { role, registerNumber, email, password } = req.body;

    // Find user (student by registerNumber OR teacher by email)
    const user = await User.findOne(
      role === 'student' ? { registerNumber } : { email }
    );

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        role: user.role,
        registerNumber: user.registerNumber,
        email: user.email,
      }
    });

  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
