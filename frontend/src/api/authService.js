import api from './apiConfig';

/**
 * Logs in a user
 * @param {object} credentials - The user's login credentials
 * @param {string} credentials.role - 'student' or 'teacher'
 * @param {string} [credentials.registerNumber] - Required if role is 'student'
 * @param {string} [credentials.email] - Required if role is 'teacher'
 * @param {string} credentials.password - The user's password
 */
export const loginUser = async (credentials) => {
  try {
    // We send the credentials to the /auth/login endpoint
    // This matches your backend authController.js
    const response = await api.post('/auth/login', credentials);
    
    // The server returns a { message, token, user } object
    return response.data;
  } catch (error) {
    // Throw an error to be caught by the component
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// We can add the registerUser function here later when needed