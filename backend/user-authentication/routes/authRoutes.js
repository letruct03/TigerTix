/**
 * authRoutes.js - Authentication service route definitions
 * Maps HTTP endpoints to authentication controller functions
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * POST /api/auth/register
 * Register a new user account
 * Public route
 * Request body: { email, password, first_name, last_name, role? }
 * Response: 201 with user data and JWT tokens, or 400/409/500 with error
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 * Public route
 * Request body: { email, password }
 * Response: 200 with user data and JWT tokens, or 401/500 with error
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * Public route
 * Request body: { refreshToken }
 * Response: 200 with new token pair, or 401/500 with error
 */
router.post('/refresh', authController.refresh);

/**
 * POST /api/auth/logout
 * Logout by revoking refresh token
 * Public route (but requires refresh token)
 * Request body: { refreshToken }
 * Response: 200 with confirmation, or 400/500 with error
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 * Protected route - requires valid access token
 * Response: 200 with user profile, or 401/404/500 with error
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * POST /api/auth/logout-all
 * Logout from all devices by revoking all refresh tokens
 * Protected route - requires valid access token
 * Response: 200 with confirmation, or 401/500 with error
 */
router.post('/logout-all', authenticate, authController.logoutAll);

module.exports = router;
