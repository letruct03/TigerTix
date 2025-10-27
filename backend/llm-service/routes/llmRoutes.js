/**
 * llmRoutes.js - LLM service route definitions
 * Maps HTTP endpoints to LLM controller functions
 */

const express = require('express');
const router = express.Router();
const llmController = require('../controllers/llmController');

/**
 * POST /api/llm/parse
 * Parse natural language input for booking intent
 * Request body: { message: "user's natural language input" }
 * Response: { intent, event_name, event_id, tickets, message, needs_confirmation }
 */
router.post('/parse', llmController.parseBookingIntent);

/**
 * POST /api/llm/confirm-booking
 * Confirm and execute a booking (with transaction safety)
 * Request body: { event_id: number, tickets: number }
 * Response: { success, message, booking }
 */
router.post('/confirm-booking', llmController.confirmBooking);

/**
 * GET /api/llm/events
 * Get all available events (events with tickets > 0)
 * Response: { success, count, events }
 */
router.get('/events', llmController.getAvailableEvents);

module.exports = router;
