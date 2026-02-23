const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private/Admin
exports.createClass = async (req, res) => {
  try {
    const { className } = req.body;

    if (!className) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    const existingClass = await Class.findOne({ className });
    if (existingClass) {
      return res.status(400).json({ message: 'Class already exists' });
    }

    const newClass = new Class({ className });
    await newClass.save();

    res.status(201).json({ message: 'Class created successfully', class: newClass });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Server error creating class' });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private/Admin, Teacher
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('students', 'registerNumber role'); 
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Server error fetching classes' });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
exports.deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Optional: Remove class reference from students before deleting
    await User.updateMany({ studentClass: classId }, { $set: { studentClass: null } });

    await Class.findByIdAndDelete(classId);
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Server error deleting class' });
  }
};

// @desc    Add a student to a class
// @route   POST /api/classes/add-student
// @access  Private/Admin
exports.addStudentToClass = async (req, res) => {
  try {
    const { classId, registerNumber } = req.body;

    // 1. Find the class
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // 2. Find the student
    const student = await User.findOne({ registerNumber, role: 'student' });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 3. Check if already in this class
    if (classObj.students.includes(student._id)) {
      return res.status(400).json({ message: 'Student already in this class' });
    }

    // 4. Update Class: Add student ID to students array
    classObj.students.push(student._id);
    await classObj.save();

    // 5. Update User: Set studentClass to class ID
    student.studentClass = classObj._id;
    await student.save();

    res.status(200).json({ message: 'Student added to class successfully', class: classObj });
  } catch (error) {
    console.error('Error adding student to class:', error);
    res.status(500).json({ message: 'Server error adding student to class' });
  }
};

// @desc    Remove a student from a class
// @route   POST /api/classes/remove-student
// @access  Private/Admin
exports.removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.body;

    // Update Class: Pull student ID from array
    await Class.findByIdAndUpdate(classId, {
      $pull: { students: studentId }
    });

    // Update User: Set studentClass to null
    await User.findByIdAndUpdate(studentId, {
      $set: { studentClass: null }
    });

    res.status(200).json({ message: 'Student removed from class' });
  } catch (error) {
    console.error('Error removing student:', error);
    res.status(500).json({ message: 'Server error removing student' });
  }
};