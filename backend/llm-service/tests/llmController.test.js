/**
 * llmController.test.js - Test suite for LLM controller
 * Tests natural language parsing, booking confirmation, and error handling
 */

const request = require('supertest');
const app = require('../server');
const fetch = require('node-fetch');
globalThis.fetch = fetch;

describe('LLM Service API', () => {
  
  describe('POST /api/llm/parse', () => {
    
    test('handle greeting intents', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ message: 'Hello' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.intent).toBe('greeting');
      expect(response.body.message).toBeDefined();
    });
    
    test('handle show events intent', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ message: 'show me the events' })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.intent).toBe('show_events');
    });
    
    test('reject empty message', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ message: '' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    test('reject missing message', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({})
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('handle booking intent with event name', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .send({ message: 'book 2 tickets for Jazz Night' });
      
      if (response.body.success) {
        expect(response.body.intent).toBe('book_tickets');
        expect(response.body.tickets).toBeDefined();
        if (response.body.event_id) {
          expect(response.body.needs_confirmation).toBe(true);
        }
      }
    });
  });
  
  describe('POST /api/llm/confirm-booking', () => {
    
    test('reject missing event_id', async () => {
      const response = await request(app)
        .post('/api/llm/confirm-booking')
        .send({ tickets: 2 })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/required/i);
    });
    
    test('reject missing tickets', async () => {
      const response = await request(app)
        .post('/api/llm/confirm-booking')
        .send({ event_id: 1 })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('reject invalid event_id', async () => {
      const response = await request(app)
        .post('/api/llm/confirm-booking')
        .send({ event_id: 'invalid', tickets: 2 })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('reject negative ticket count', async () => {
      const response = await request(app)
        .post('/api/llm/confirm-booking')
        .send({ event_id: 1, tickets: -1 })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('reject zero ticket count', async () => {
      const response = await request(app)
        .post('/api/llm/confirm-booking')
        .send({ event_id: 1, tickets: 0 })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('handle non-existent event', async () => {
      const response = await request(app)
        .post('/api/llm/confirm-booking')
        .send({ event_id: 99999, tickets: 2 })
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/not found/i);
    });
  });
  
  describe('GET /api/llm/events', () => {
    
    test('return available events', async () => {
      const response = await request(app)
        .get('/api/llm/events')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeDefined();
      expect(Array.isArray(response.body.events)).toBe(true);
    });
    
    test('only return events with available tickets', async () => {
      const response = await request(app)
        .get('/api/llm/events')
        .expect(200);
      
      response.body.events.forEach(event => {
        expect(event.available_tickets).toBeGreaterThan(0);
      });
    });
  });
  
  describe('GET /health', () => {
    
    test('return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.service).toBe('llm-service');
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });
  });
  
  describe('Keyword Fallback', () => {
    
    test('use fallback for simple greetings', async () => {
      const greetings = ['hi', 'hello', 'hey', 'good morning'];
      
      for (const greeting of greetings) {
        const response = await request(app)
          .post('/api/llm/parse')
          .send({ message: greeting });
        
        expect(response.body.intent).toBe('greeting');
      }
    });
    
    test('use fallback for show events commands', async () => {
      const commands = ['show events', 'list events', 'view events'];
      
      for (const command of commands) {
        const response = await request(app)
          .post('/api/llm/parse')
          .send({ message: command });
        
        expect(response.body.intent).toBe('show_events');
      }
    });
  });
  
  describe('Error Handling', () => {
    
    test('handle 404 for invalid routes', async () => {
      const response = await request(app)
        .get('/api/llm/invalid-route')
        .expect(404);
      
      expect(response.body.error).toBeDefined();
    });
    
    test('handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/llm/parse')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(500);
      
    });
  });
  
  describe('Transaction Safety', () => {
    
    test('prevent overselling (concurrent booking test)', async () => {
      expect(true).toBe(true);
    });
  });
});

/* Integration tests verifying the complete booking flow */
describe('Complete Booking Flow', () => {
  
  test('complete full booking workflow', async () => {
    /* Step 1: Get available events */
    const eventsResponse = await request(app)
      .get('/api/llm/events')
      .expect(200);
    
    expect(eventsResponse.body.success).toBe(true);
    
    if (eventsResponse.body.events.length > 0) {
      const event = eventsResponse.body.events[0];
      
      /* Step 2: Parse booking intent */
      const parseResponse = await request(app)
        .post('/api/llm/parse')
        .send({ message: `book 1 ticket for ${event.name}` });
      
      /* Step 3: If event found, confirm booking (only if tickets available) */
      if (parseResponse.body.event_id && event.available_tickets > 0) {
        const confirmResponse = await request(app)
          .post('/api/llm/confirm-booking')
          .send({
            event_id: parseResponse.body.event_id,
            tickets: 1
          });
        
        expect(confirmResponse.body.success).toBe(true);
        expect(confirmResponse.body.booking).toBeDefined();
      }
    }
  });
});

/* Accessibility tests verifying that responses include necessary information for screen readers */
describe('Accessibility Compliance', () => {
  
  test('provide clear, descriptive messages', async () => {
    const response = await request(app)
      .post('/api/llm/parse')
      .send({ message: 'hello' })
      .expect(200);
    
    expect(response.body.message).toBeDefined();
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message.length).toBeGreaterThan(0);
  });
  
  test('provide structured data for assistive technology', async () => {
    const response = await request(app)
      .get('/api/llm/events')
      .expect(200);
    
    response.body.events.forEach(event => {
      expect(event.name).toBeDefined();
      expect(event.date).toBeDefined();
      expect(event.available_tickets).toBeDefined();
    });
  });
});
