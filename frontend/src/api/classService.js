import api from './apiConfig';

// Get all classes
export const getAllClasses = async () => {
  try {
    const response = await api.get('/classes');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch classes');
  }
};

// Create a new class
export const createClass = async (className) => {
  try {
    const response = await api.post('/classes', { className });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create class');
  }
};

// Delete a class
export const deleteClass = async (classId) => {
  try {
    await api.delete(`/classes/${classId}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete class');
  }
};

// Add student to class
export const addStudentToClass = async (classId, registerNumber) => {
  try {
    const response = await api.post('/classes/add-student', { classId, registerNumber });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add student');
  }
};

// Remove student from class
export const removeStudentFromClass = async (classId, studentId) => {
  try {
    const response = await api.post('/classes/remove-student', { classId, studentId });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to remove student');
  }
};