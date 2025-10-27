const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// GET /api/events - Get all events
router.get('/', clientController.getAllEvents);

// POST /api/events/:id/purchase - Purchase a ticket
router.post('/:id/purchase', clientController.purchaseTicket);

module.exports = router;