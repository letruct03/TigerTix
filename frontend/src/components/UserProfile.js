/**
 * UserProfile.js - User profile component
 * Displays user information and provides account management options
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout, logoutAll, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to logout from all devices?')) {
      await logoutAll();
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h2>Not Logged In</h2>
          <p>Please log in to view your profile.</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </div>
          <h1>{user.firstName} {user.lastName}</h1>
          <p className="profile-email">{user.email}</p>
          <span className={`role-badge role-${user.role}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </div>

        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>User ID</label>
              <span>{user.id}</span>
            </div>
            <div className="info-item">
              <label>Email Status</label>
              <span className={user.isVerified ? 'verified' : 'unverified'}>
                {user.isVerified ? '✓ Verified' : '✗ Not Verified'}
              </span>
            </div>
            <div className="info-item">
              <label>Account Type</label>
              <span>{user.role}</span>
            </div>
            <div className="info-item">
              <label>Member Since</label>
              <span>
                {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString() 
                  : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <label>Last Login</label>
              <span>
                {user.lastLogin 
                  ? new Date(user.lastLogin).toLocaleString() 
                  : 'First login'}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              🏠 Go to Home
            </button>
            <button
              onClick={() => navigate('/events')}
              className="btn-secondary"
            >
              🎫 Browse Events
            </button>
            {user.role === 'organizer' && (
              <button
                onClick={() => navigate('/admin')}
                className="btn-secondary"
              >
                📊 Manage Events
              </button>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2>Security</h2>
          <div className="security-buttons">
            <button
              onClick={handleLogout}
              className="btn-logout"
              disabled={loading}
            >
              🚪 Logout
            </button>
            <button
              onClick={handleLogoutAll}
              className="btn-logout-all"
              disabled={loading}
            >
              🚪🚪 Logout All Devices
            </button>
          </div>
          <p className="security-note">
            "Logout All Devices" will end all active sessions on other devices
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
