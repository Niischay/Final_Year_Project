import api from './apiConfig';

/**
 * Creates a new QR session
 * @param {object} sessionData
 * @param {string} sessionData.className
 * @param {string} sessionData.subjectName
 * @param {number} sessionData.periodNumber
 * @param {object} sessionData.teacherLocation
 * @param {number} sessionData.teacherLocation.latitude
 * @param {number} sessionData.teacherLocation.longitude
 * @param {string} sessionId
 */
export const createQrSession = async (sessionData) => {
  try {
    // The interceptor we added to apiConfig.js will handle the token.
    // This matches your backend qrController.js
    const response = await api.post('/qr/create', sessionData);
    
    // Returns { message, sessionId, qrImage }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create session');
  }
};

export const endQrSession = async (sessionId) => {
  try {
    // This calls POST /api/qr/end/:sessionId
    const response = await api.post(`/qr/end/${sessionId}`);
    
    // Returns { message: "Session ended successfully" }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to end session');
  }
};