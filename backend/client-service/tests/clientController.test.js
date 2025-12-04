/** 
 * clientController.test.js - test suite for client service
 * tests admin-level input validation and basic functions
 * such as fetching, adding, removing, and editing events
 */
const { createEvent } = require('../../admin-service/models/adminModel');
const request = require('supertest');
const app = require ('../server');

describe('Client Service', () => {
  // GET /
  test('GET / should return service running message', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.message).toBe('Client Service is running');
    expect(response.body.endpoints).toHaveProperty('getAllEvents');
    expect(response.body.endpoints).toHaveProperty('purchaseTicket');
    expect(response.body.endpoints).toHaveProperty('health');
  });

  // GET /health
  test('GET /health should return OK status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.service).toBe('client-service');
    expect(response.body.timestamp).toBeDefined();
  });

  // GET /api/events
  test('GET /api/eventAllEvents should return events list', async () => {
    const response = await request(app)
      .get('/api/events')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  // POST /api/events/:id/purchase
  test('POST /api/events/:id/purchase should work', async () => {
    const newEvent = await createEvent({
      name: "Concert Night",
      date: "2025-12-15",
      total_tickets: 5,
      price: 100
    });
    const response = await request(app)
      .post(`/api/events/${newEvent.id}/purchase`)
      .send({ quantity: 1 })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});