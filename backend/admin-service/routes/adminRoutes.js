/**
 * adminRoutes.js - Admin service route definitions
 * Maps HTTP endpoints to controller functions
 * All routes are prefixed with /api/admin in server.js
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

/**
 * POST /api/admin/events
 * Create a new event
 * Request body: { name, date, total_tickets, description?, location?, category?, price? }
 * Response: 201 with created event, or 400/500 with error
 */
router.post('/events', adminController.createEvent);

/**
 * GET /api/admin/events
 * Get all events
 * Response: 200 with array of events
 */
router.get('/events', adminController.listEvents);

/**
 * GET /api/admin/events/:id
 * Get a single event by ID
 * Response: 200 with event details, or 404 if not found
 */
router.get('/events/:id', adminController.getEvent);

/**
 * PUT /api/admin/events/:id
 * Update an existing event
 * Request body: Any event fields to update
 * Response: 200 with updated event, or 404 if not found
 */
router.put('/events/:id', adminController.updateEvent);

/**
 * DELETE /api/admin/events/:id
 * Delete an event
 * Response: 200 with confirmation, or 404 if not found
 */
router.delete('/events/:id', adminController.deleteEvent);

module.exports = router;