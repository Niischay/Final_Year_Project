import React, { useState, useEffect } from 'react';
import { getAllClasses, createClass, deleteClass, addStudentToClass, removeStudentFromClass } from '../../api/classService';
import '../../App.css'; // Reuse your global styles

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [newClassName, setNewClassName] = useState('');
  
  // State for adding a student
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [studentRegNo, setStudentRegNo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getAllClasses();
      setClasses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newClassName.trim()) return;

    try {
      await createClass(newClassName);
      setSuccess(`Class "${newClassName}" created!`);
      setNewClassName('');
      fetchClasses(); // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure? This will unlink all students from this class.')) return;
    try {
      await deleteClass(id);
      fetchClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !studentRegNo) return;
    setError('');
    setSuccess('');

    try {
      await addStudentToClass(selectedClassId, studentRegNo);
      setSuccess(`Student ${studentRegNo} added successfully!`);
      setStudentRegNo('');
      fetchClasses(); // Refresh to show new student in list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    if (!window.confirm('Remove student from this class?')) return;
    try {
      await removeStudentFromClass(classId, studentId);
      fetchClasses();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard-card" style={{ marginTop: '2rem' }}>
      <h3>Class Management</h3>
      
      {/* 1. Create Class Section */}
      <form onSubmit={handleCreateClass} style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
        <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter new Class Name (e.g. CSE-A)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="scan-button" style={{ width: 'auto', marginTop: 0 }}>
            Create Class
          </button>
        </div>
      </form>

      {/* Messages */}
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message" style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

      {/* 2. Add Student Section */}
      <div style={{ marginBottom: '2rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
        <h4>Add Student to Class</h4>
        <form onSubmit={handleAddStudent}>
            <div className="form-group">
                <select 
                    value={selectedClassId || ''} 
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                    required
                >
                    <option value="" disabled>Select a Class</option>
                    {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>{cls.className}</option>
                    ))}
                </select>
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    placeholder="Student Register Number"
                    value={studentRegNo}
                    onChange={(e) => setStudentRegNo(e.target.value)}
                    required
                    style={{ flex: 1 }}
                />
                <button type="submit" className="scan-button" style={{ width: 'auto', marginTop: 0 }}>Add</button>
            </div>
        </form>
      </div>

      {/* 3. Class List Display */}
      <div>
        <h4>Existing Classes</h4>
        {classes.length === 0 ? <p>No classes created yet.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {classes.map((cls) => (
              <div key={cls._id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0, fontSize: '1.1rem' }}>{cls.className}</h5>
                  <button 
                    onClick={() => handleDeleteClass(cls._id)}
                    style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete Class
                  </button>
                </div>
                
                <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                  Students: {cls.students.length}
                </p>
                
                {/* List Students in this class */}
                {cls.students.length > 0 && (
                  <ul style={{ fontSize: '0.9rem', background: '#eee', padding: '10px 20px', borderRadius: '4px' }}>
                    {cls.students.map(std => (
                      <li key={std._id} style={{ marginBottom: '5px' }}>
                        {std.registerNumber} 
                        <span 
                            onClick={() => handleRemoveStudent(cls._id, std._id)}
                            style={{ color: 'red', marginLeft: '10px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            (Remove)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassManagement;