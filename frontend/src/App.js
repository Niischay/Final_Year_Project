import React from 'react';
import './index.css';
import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import useAuth from './hooks/useAuth';

// Import Pages
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard'; 
import ScanPage from './pages/ScanPage'; 
import FlaggedPage from './pages/FlaggedPage';

// Import Common Components
import Header from './components/common/Header'; 

// --- All imports are now above this line ---

// We'll create these page components in the next steps
// For now, they can be simple placeholders
// const StudentDashboard = () => <div className="page-container"><h2>Student Dashboard</h2><p>Welcome! Scan your QR code to mark attendance.</p></div>;
// const TeacherDashboard = () => <div className="page-container"><h2>Teacher Dashboard</h2><p>Welcome! Create a new session to get started.</p></div>;
// const ScanPage = () => <div className="page-container"><h2>Scan QR Code</h2></div>;
// const FlaggedPage = () => <div className="page-container"><h2>Flagged Attendances</h2></div>;
const NotFoundPage = () => <div className="page-container"><h2>404 - Page Not Found</h2></div>;

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <div className="App">
        <Header />
        
        <Routes>
          {/* Public Route */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? <LoginPage /> : <Navigate to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} />
            } 
          />

          {/* ----- Protected Routes ----- */}
          {/* Student Routes */}
          <Route 
            path="/student-dashboard" 
            element={isAuthenticated ? <StudentDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/scan" 
            element={isAuthenticated ? <ScanPage /> : <Navigate to="/login" />} 
          />
          
          {/* Teacher Routes */}
          <Route 
            path="/teacher-dashboard" 
            element={isAuthenticated ? <TeacherDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/flagged/:sessionId" 
            element={isAuthenticated ? <FlaggedPage /> : <Navigate to="/login" />} 
          />

          {/* Catch-all Routes */}
          <Route 
            path="/" 
            element={
              !isAuthenticated ? <Navigate to="/login" /> : <Navigate to={user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'} />
            }
          />
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;