const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.registerStudent = async (req, res) => {
  try {
    const { name, registerNumber, password } = req.body;

    const existingUser = await User.findOne({ registerNumber });
    if (existingUser) return res.status(400).json({ message: 'Student already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      registerNumber,
      password: hashedPassword,
      role: 'student'
    });

    await user.save();

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { registerNumber, password } = req.body;

    const user = await User.findOne({ registerNumber });
    if (!user || user.role !== 'student')
      return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({ token, name: user.name });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
