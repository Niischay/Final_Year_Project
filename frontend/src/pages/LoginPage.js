import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authService';
import useAuth from '../hooks/useAuth';
import '../App.css'; // We'll add styles here

const LoginPage = () => {
  const [role, setRole] = useState('student');
  const [registerNumber, setRegisterNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth(); // Get the login function from our context
  const navigate = useNavigate(); // Hook for redirecting

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare credentials based on role
    const credentials = {
      role,
      password,
      ...(role === 'student' ? { registerNumber } : { email }),
    };

    try {
      // Call the API service
      const data = await loginUser(credentials);
      
      // Use the login function from AuthContext to save user data
      login(data);

      // Redirect based on role
      if (data.user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>QR Attendance Login</h2>
        
        {/* Role Selector */}
        <div className="role-selector">
          <label>
            <input
              type="radio"
              value="student"
              checked={role === 'student'}
              onChange={() => setRole('student')}
            />
            Student
          </label>
          <label>
            <input
              type="radio"
              value="teacher"
              checked={role === 'teacher'}
              onChange={() => setRole('teacher')}
            />
            Teacher
          </label>
        </div>

        {/* Dynamic Fields */}
        {role === 'student' ? (
          <div className="form-group">
            <label>Register Number</label>
            <input
              type="text"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;