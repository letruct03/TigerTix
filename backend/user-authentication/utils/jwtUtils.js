/**
 * jwtUtils.js - JWT token generation and verification utilities
 * Handles creation and validation of access and refresh tokens
 */

const jwt = require('jsonwebtoken');
const crypto = require("crypto");

// JWT configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'tigertix-access-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tigertix-refresh-secret-change-in-production';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m'; // 15 minutes
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; // 7 days

/**
 * Generate access token (short-lived)
 * @param {Object} payload - Token payload
 * @param {number} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    type: 'access'
  };

  return jwt.sign(tokenPayload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: 'tigertix-auth',
    audience: 'tigertix-api'
  });
};

/**
 * Generate refresh token (long-lived)
 * @param {Object} payload - Token payload
 * @param {number} payload.userId - User ID
 * @returns {Object} Refresh token and expiration date
 */
const generateRefreshToken = (payload) => {
  const tokenPayload = {
    userId: payload.userId,
    type: 'refresh',
    jti: crypto.randomUUID()
  };

  const token = jwt.sign(tokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    issuer: 'tigertix-auth',
    audience: 'tigertix-api'
  });

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  return { token, expiresAt };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'tigertix-auth',
      audience: 'tigertix-api'
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'tigertix-auth',
      audience: 'tigertix-api'
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Access token, refresh token, and expiration
 */
const generateTokenPair = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(payload);
  const { token: refreshToken, expiresAt } = generateRefreshToken({ userId: user.id });

  return {
    accessToken,
    refreshToken,
    expiresAt,
    tokenType: 'Bearer'
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  generateTokenPair
};
