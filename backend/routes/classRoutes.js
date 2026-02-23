const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { 
  createClass, 
  getAllClasses, 
  deleteClass, 
  addStudentToClass, 
  removeStudentFromClass 
} = require('../controllers/classController');

// All routes here are protected
router.use(protect);

// Admin only routes
router.post('/', admin, createClass);
router.delete('/:id', admin, deleteClass);
router.post('/add-student', admin, addStudentToClass);
router.post('/remove-student', admin, removeStudentFromClass);

// Teachers and Admins can view classes
router.get('/', getAllClasses);

module.exports = router;