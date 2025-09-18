import React, { useState, useMemo } from 'react';
import AuthContext from './AuthContext';

// We get the initial state from localStorage
const storedToken = localStorage.getItem('token');
const storedUser = JSON.parse(localStorage.getItem('user'));

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(storedUser);

  // This will be true if a token exists
  const isAuthenticated = !!token;

  // Function to handle login
  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('user', JSON.stringify(userData.user));
    setToken(userData.token);
    setUser(userData.user);
  };

  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // We use useMemo to optimize and prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      login,
      logout,
    }),
    [token, user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};