/**
 * App.js - Main application component with routing and authentication
 * Integrates auth system with event browsing and chat features
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/authContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import EventsPage from './components/EventsPage';
import './App.css';

export function AppContent() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        
        <main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="App-footer">
          <p>© 2025 TigerTix - Clemson University</p>
          <p className="sprint-info">Sprint 3: Multi-Layered Authentication</p>
        </footer>
      </div>
    </AuthProvider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <EventsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/events" 
                element={
                  <ProtectedRoute>
                    <EventsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Redirect unknown routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="App-footer">
            <p>© 2025 TigerTix - Clemson University</p>
            <p className="sprint-info">Sprint 3: Multi-Layered Authentication</p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
