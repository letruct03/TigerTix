/**
 * adminController.js - Admin service business logic layer
 * Handles HTTP requests, validates input, and coordinates with the model layer to manage events
 */

const adminModel = require('../models/adminModel');

/**
 * Create a new event
 * POST /api/admin/events
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing event details
 * @param {string} req.body.name - Event name (required)
 * @param {string} req.body.date - Event date in YYYY-MM-DD format (required)
 * @param {number} req.body.total_tickets - Total number of tickets (required)
 * @param {string} req.body.description - Event description (optional)
 * @param {string} req.body.location - Event location (optional)
 * @param {string} req.body.category - Event category (optional)
 * @param {number} req.body.price - Ticket price (optional, default 0.0)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with created event or error
 */
const createEvent = async (req, res) => {
  try {
    const { name, date, total_tickets, description, location, category, price } = req.body;

    // Input validation - check required fields
    if (!name || !date || !total_tickets) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'date', 'total_tickets'],
        received: { name, date, total_tickets }
      });
    }

    // Validate name is not empty
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid event name',
        message: 'Event name must be a non-empty string'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format',
        example: '2025-09-15'
      });
    }

    // Validate date is not in the past
    const eventDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (eventDate < today) {
      return res.status(400).json({
        error: 'Invalid date',
        message: 'Event date cannot be in the past'
      });
    }

    // Validate total_tickets is a positive integer
    const ticketCount = parseInt(total_tickets, 10);
    if (isNaN(ticketCount) || ticketCount <= 0) {
      return res.status(400).json({
        error: 'Invalid ticket count',
        message: 'total_tickets must be a positive integer'
      });
    }

    // Validate price if provided
    if (price !== undefined) {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue < 0) {
        return res.status(400).json({
          error: 'Invalid price',
          message: 'Price must be a non-negative number'
        });
      }
    }

    // Prepare event data
    const eventData = {
      name: name.trim(),
      date,
      total_tickets: ticketCount,
      description: description ? description.trim() : '',
      location: location ? location.trim() : '',
      category: category ? category.trim() : 'General',
      price: price ? parseFloat(price) : 0.0
    };

    // Create event in database
    const newEvent = await adminModel.createEvent(eventData);

    // Return success response with created event
    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent
    });

  } catch (error) {
    console.error('Error in createEvent controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create event. Please try again later.'
    });
  }
};

/**
 * Get all events
 * GET /api/admin/events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with array of events
 */
const listEvents = async (req, res) => {
  try {
    const events = await adminModel.getAllEvents();
    
    res.status(200).json({
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error in listEvents controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve events'
    });
  }
};

/**
 * Get a single event by ID
 * GET /api/admin/events/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with event details or error
 */
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({
        error: 'Invalid event ID',
        message: 'Event ID must be a number'
      });
    }

    const event = await adminModel.getEventById(eventId);

    if (!event) {
      return res.status(404).json({
        error: 'Event not found',
        message: `No event found with ID: ${eventId}`
      });
    }

    res.status(200).json({ event });
  } catch (error) {
    console.error('Error in getEvent controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve event'
    });
  }
};

/**
 * Update an existing event
 * PUT /api/admin/events/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event ID
 * @param {Object} req.body - Fields to update
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated event or error
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({
        error: 'Invalid event ID',
        message: 'Event ID must be a number'
      });
    }

    // Check if any updates provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Request body must contain at least one field to update'
      });
    }

    // Validate date format if date is being updated
    if (updates.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(updates.date)) {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'Date must be in YYYY-MM-DD format'
        });
      }
    }

    // Validate total_tickets if being updated
    if (updates.total_tickets !== undefined) {
      const ticketCount = parseInt(updates.total_tickets, 10);
      if (isNaN(ticketCount) || ticketCount <= 0) {
        return res.status(400).json({
          error: 'Invalid ticket count',
          message: 'total_tickets must be a positive integer'
        });
      }
      updates.total_tickets = ticketCount;
    }

    const updatedEvent = await adminModel.updateEvent(eventId, updates);

    res.status(200).json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error in updateEvent controller:', error);
    
    if (error.message === 'Event not found') {
      return res.status(404).json({
        error: 'Event not found',
        message: `No event found with ID: ${req.params.id}`
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update event'
    });
  }
};

/**
 * Delete an event
 * DELETE /api/admin/events/:id
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Event ID
 * @param {Object} res - Express response object
 * @returns {Object} JSON response confirming deletion or error
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({
        error: 'Invalid event ID',
        message: 'Event ID must be a number'
      });
    }

    await adminModel.deleteEvent(eventId);

    res.status(200).json({
      message: 'Event deleted successfully',
      deletedEventId: eventId
    });
  } catch (error) {
    console.error('Error in deleteEvent controller:', error);
    
    if (error.message === 'Event not found') {
      return res.status(404).json({
        error: 'Event not found',
        message: `No event found with ID: ${req.params.id}`
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete event'
    });
  }
};

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent
};