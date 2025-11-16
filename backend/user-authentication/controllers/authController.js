/**
 * authController.js - Authentication service business logic
 * Handles user registration, login, token refresh, and logout
 */

const bcrypt = require('bcryptjs');
const authModel = require('../models/authModel');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwtUtils');

/**
 * Register a new user
 * POST /api/auth/register
 * @param {Object} req.body - Registration data
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password (plain text)
 * @param {string} req.body.first_name - User's first name
 * @param {string} req.body.last_name - User's last name
 * @param {string} req.body.role - User role (optional, defaults to 'user')
 */
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email, password, first name, and last name are required.',
        required: ['email', 'password', 'first_name', 'last_name']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address.'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password must be at least 8 characters long.'
      });
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      });
    }

    // Validate name fields
    if (first_name.trim().length < 2 || last_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Invalid name',
        message: 'First name and last name must be at least 2 characters long.'
      });
    }

    // Validate role if provided
    const validRoles = ['user', 'organizer', 'admin'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`
      });
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const userData = {
      email: email.toLowerCase().trim(),
      password_hash,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: role || 'user'
    };

    const newUser = await authModel.createUser(userData);

    // Generate JWT tokens
    const tokens = generateTokenPair(newUser);

    // Store refresh token in database
    await authModel.storeRefreshToken(
      newUser.id,
      tokens.refreshToken,
      tokens.expiresAt
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        isVerified: newUser.is_verified
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: tokens.tokenType,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        message: 'An account with this email address already exists. Please login or use a different email.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration. Please try again later.'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 * @param {Object} req.body - Login credentials
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required.',
        required: ['email', 'password']
      });
    }

    // Find user by email (include password hash for verification)
    const user = await authModel.findUserByEmail(email.toLowerCase().trim(), true);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password.'
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password.'
      });
    }

    // Update last login timestamp
    await authModel.updateLastLogin(user.id);

    // Generate JWT tokens
    const tokens = generateTokenPair(user);

    // Store refresh token in database
    await authModel.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.expiresAt
    );

    // Return success response (without password hash)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified,
        lastLogin: user.last_login
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: tokens.tokenType,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login. Please try again later.'
    });
  }
};

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 * @param {Object} req.body - Refresh token
 * @param {string} req.body.refreshToken - Valid refresh token
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing refresh token',
        message: 'Refresh token is required.'
      });
    }

    // Verify refresh token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: error.message
      });
    }

    // Check if refresh token exists in database and is not revoked
    const tokenRecord = await authModel.findRefreshToken(refreshToken);

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token has been revoked or does not exist.'
      });
    }

    // Get user information
    const user = await authModel.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists.'
      });
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    // Store new refresh token
    await authModel.storeRefreshToken(
      user.id,
      tokens.refreshToken,
      tokens.expiresAt
    );

    // Optionally revoke old refresh token (for security)
    await authModel.revokeRefreshToken(refreshToken);

    // Return new tokens
    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: tokens.tokenType,
        expiresIn: '15m'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      message: 'An error occurred while refreshing tokens.'
    });
  }
};

/**
 * Logout user (revoke refresh token)
 * POST /api/auth/logout
 * @param {Object} req.body - Refresh token to revoke
 * @param {string} req.body.refreshToken - Refresh token
 */
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing refresh token',
        message: 'Refresh token is required for logout.'
      });
    }

    // Revoke the refresh token
    await authModel.revokeRefreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      info: 'Refresh token has been revoked.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred during logout.'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Requires authentication
 */
const getCurrentUser = async (req, res) => {
  try {
    // User information is attached by authenticate middleware
    const user = await authModel.findUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found.'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile',
      message: 'An error occurred while fetching user information.'
    });
  }
};

/**
 * Logout from all devices (revoke all refresh tokens)
 * POST /api/auth/logout-all
 * Requires authentication
 */
const logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    // Revoke all refresh tokens for this user
    const revokedCount = await authModel.revokeAllUserTokens(userId);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
      info: `${revokedCount} session(s) terminated.`
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'An error occurred while logging out from all devices.'
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  logoutAll
};
