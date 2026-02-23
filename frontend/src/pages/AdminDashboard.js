import React, { useState } from 'react';
import { addUser } from '../api/adminService';
import FaceUpload from '../components/admin/FaceUpload';
import ClassManagement from '../components/admin/ClassManagement';
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
        role: activeTab === 'student' ? 'student' : 'teacher',
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
      
      {/* Tab Navigation */}
      <div className="role-selector" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <button 
            className={activeTab === 'student' ? 'active-tab-btn' : 'tab-btn'}
            onClick={() => setActiveTab('student')}
            style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'student' ? '#007bff' : '#eee', color: activeTab === 'student' ? 'white' : 'black', border: 'none', borderRadius: '5px'}}
        >
            Add Student
        </button>
        <button 
            className={activeTab === 'teacher' ? 'active-tab-btn' : 'tab-btn'}
            onClick={() => setActiveTab('teacher')}
            style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'teacher' ? '#007bff' : '#eee', color: activeTab === 'teacher' ? 'white' : 'black', border: 'none', borderRadius: '5px'}}
        >
            Add Teacher
        </button>
        <button 
            className={activeTab === 'classes' ? 'active-tab-btn' : 'tab-btn'}
            onClick={() => setActiveTab('classes')}
            style={{ padding: '10px', cursor: 'pointer', background: activeTab === 'classes' ? '#007bff' : '#eee', color: activeTab === 'classes' ? 'white' : 'black', border: 'none', borderRadius: '5px'}}
        >
            Manage Classes
        </button>
      </div>

      {/* Render Content Based on Tab */}
      {activeTab === 'classes' ? (
        <ClassManagement />
      ) : (
        <>
            <div className="dashboard-card">
                <h3>Add New {activeTab === 'student' ? 'Student' : 'Teacher'}</h3>
                
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
            
            {/* Show Face Upload only for Student tab */}
            {activeTab === 'student' && <FaceUpload />}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;