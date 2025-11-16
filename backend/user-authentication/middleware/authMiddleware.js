/**
 * authMiddleware.js - Authentication and authorization middleware
 * Protects routes and verifies user permissions
 */

const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwtUtils');
const authModel = require('../models/authModel');

/**
 * Authenticate user by verifying JWT token
 * Attaches user information to req.user if valid
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'No token provided. Please include a valid Bearer token in the Authorization header.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: error.message
      });
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await authModel.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'The user associated with this token no longer exists or is inactive.'
      });
    }

    // Attach user to request object for use in route handlers
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isVerified: user.is_verified
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication.'
    });
  }
};

/**
 * Authorize user based on roles
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} Middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.'
      });
    }

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`
      });
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 * Useful for routes that behave differently for authenticated vs. unauthenticated users
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      return next();
    }

    try {
      const decoded = verifyAccessToken(token);
      const user = await authModel.findUserById(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isVerified: user.is_verified
        };
      } else {
        req.user = null;
      }
    } catch (error) {
      // Invalid token, continue without authentication
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

/**
 * Require email verification
 * Must be used after authenticate middleware
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'You must be logged in to access this resource.'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
      message: 'Please verify your email address to access this resource.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
  requireVerified
};
