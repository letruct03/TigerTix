/**
 * Header.js - Application header with navigation
 * Shows user info when logged in, login/register buttons when not
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import'./Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>🎫 TigerTix</h1>
        </Link>

        <nav className="main-nav">
          {user ? (
            <>
              <Link to="/events" className="nav-link">
                Browse Events
              </Link>
              
              {user.role === 'organizer' && (
                <Link to="/admin" className="nav-link">
                  Manage Events
                </Link>
              )}

              <div className="user-menu-container">
                <button
                  className="user-menu-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <span className="user-avatar">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </span>
                  <span className="user-name">
                    {user.firstName}
                  </span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <p className="dropdown-name">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="dropdown-email">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      👤 My Profile
                    </Link>
                    
                    <button
                      className="dropdown-item logout-button"
                      onClick={handleLogout}
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">
                Sign In
              </Link>
              <Link to="/register" className="btn-register">
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
