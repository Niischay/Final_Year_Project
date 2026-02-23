import api from './apiConfig';

export const addUser = async (userData) => {
  try {
    // The interceptor in apiConfig will automatically attach the Admin's token
    const response = await api.post('/admin/add-user', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to add user');
  }
};

export const uploadFaceData = async (data) => {
  try {
    const response = await api.post('/admin/upload-face', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload face data');
  }
};