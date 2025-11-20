/**
 * ProtectedRoute.js - Route protection component
 * Redirects unauthenticated users to login page
 * Optionally checks for specific roles
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="unauthorized-container">
        <h2>🚫 Unauthorized Access</h2>
        <p>You don't have permission to access this page.</p>
        <p>Required role: {requiredRole}</p>
        <p>Your role: {user.role}</p>
      </div>
    );
  }

  // User is authenticated and has required role
  return children;
};

export default ProtectedRoute;
