import api from './apiConfig';

/**
 * Marks attendance for the logged-in student
 * @param {object} attendanceData
 * @param {string} attendanceData.sessionId - The ID from the QR code
 * @param {object} attendanceData.location - The student's current location
 * @param {number} attendanceData.location.latitude
 * @param {number} attendanceData.location.longitude
 * @param {string} sessionId - The ID of the session
 * @param {string} attendanceId - The unique _id of the attendance record
 */
export const markAttendance = async (attendanceData) => {
  try {
    // This will send the token automatically (thanks to our interceptor)
    // and matches your backend attendanceController.js
    const response = await api.post('/attendance/mark', attendanceData);
    
    // Returns { message: "..." }
    return response.data;
  } catch (error) {
    // The backend sends specific error messages which we can show
    throw new Error(error.response?.data?.message || 'Failed to mark attendance');
  }
};

export const getFlaggedAttendance = async (sessionId) => {
  try {
    // This calls GET /api/attendance/flagged/:sessionId
    const response = await api.get(`/attendance/flagged/${sessionId}`);
    
    // Returns { message, flaggedAttendances }
    return response.data.flaggedAttendances;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch flagged attendance');
  }
};

export const approveFlaggedAttendance = async (attendanceId) => {
  try {
    // This calls PUT /api/attendance/approve/:attendanceId
    const response = await api.put(`/attendance/approve/${attendanceId}`);
    
    // Returns { message, record }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to approve attendance');
  }
};