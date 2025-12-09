import React, { useState } from 'react';
import { addUser } from '../api/adminService';
import '../App.css'; // Using existing styles

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'teacher'
  
  // Form State
  const [formData, setFormData] = useState({
    registerNumber: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = {
        role: activeTab,
        password: formData.password,
        // Send registerNumber only for students, Email for teachers
        ...(activeTab === 'student' ? { registerNumber: formData.registerNumber } : { email: formData.email })
      };

      const response = await addUser(data);
      setMessage(response.message);
      
      // Clear form on success
      setFormData({ registerNumber: '', email: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Admin Dashboard</h2>
      
      <div className="dashboard-card">
        <h3>Add New User</h3>
        
        {/* Toggle Tabs */}
        <div className="role-selector" style={{ marginBottom: '1.5rem' }}>
          <label>
            <input 
              type="radio" 
              name="userType" 
              checked={activeTab === 'student'} 
              onChange={() => { setActiveTab('student'); setMessage(''); setError(''); }}
            />
            <span>Add Student</span>
          </label>
          <label>
            <input 
              type="radio" 
              name="userType" 
              checked={activeTab === 'teacher'} 
              onChange={() => { setActiveTab('teacher'); setMessage(''); setError(''); }}
            />
            <span>Add Teacher</span>
          </label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {activeTab === 'student' ? (
            <div className="form-group">
              <label>Register Number</label>
              <input
                type="text"
                name="registerNumber"
                value={formData.registerNumber}
                onChange={handleChange}
                placeholder="e.g., 12345"
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="teacher@example.com"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Set initial password"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message" style={{ textAlign: 'center', color: 'green' }}>{message}</p>}

          <button type="submit" className="scan-button" disabled={loading} style={{ width: '100%', marginTop: '0' }}>
            {loading ? 'Adding...' : `Add ${activeTab === 'student' ? 'Student' : 'Teacher'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;