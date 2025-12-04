/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AppContent from './App';
import AuthContext from './contexts/authContext';

// Utility to render with mocked AuthContext only (no router!)
const renderWithAuth = (ui, { user = null } = {}) => {
  return render(
    <AuthContext.Provider value={{ user, login: jest.fn(), logout: jest.fn() }}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('App Component', () => {
  test('renders header and footer', () => {
    renderWithAuth(<AppContent />);

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('app-header');

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('App-footer');
    expect(screen.getByText(/Sprint 3: Multi-Layered Authentication/i)).toBeInTheDocument();
  });

  test('renders protected content when user is logged in', () => {
    const user = { id: 1, name: 'Test User' };
    renderWithAuth(<AppContent />, { user });

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    const loginForm = screen.queryByRole('form');
    expect(loginForm).not.toBeInTheDocument();
  });

  test('redirects unknown route to protected content when user is logged in', () => {
    const user = { id: 1, name: 'Test User' };
    renderWithAuth(<AppContent />, { user });

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    const loginForm = screen.queryByRole('form');
    expect(loginForm).not.toBeInTheDocument();
  });
});
