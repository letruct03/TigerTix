/** 
 * adminController.test.js - test suite for admin service
 * tests admin-level input validation and basic functions
 * such as fetching, adding, removing, and editing events
 */
const request = require('supertest');
const app = require ('../server');

describe('Admin Service', () => {

    /** Create a new event */
    describe('POST /api/admin/events', () => {

        it('should create events when given proper data', async () => {
            const response = await request(app)
                .post('api/admin/events')
                .send({name: 'event', date: '2025-12-31', total_tickets: 300})
                .expect(201)

            expect(response.body.success).toBe(true);
            expect(response.body.name).toBe('event');
            expect(response.body.date).toBe('2025-12-31');
            expect(response.body.total_tickets).toBe(300);
        });

        it('should reject requests with unfilled required fields', async () => {
            const response = await request(app)
                .post('api/admin/events')
                .send({name: 'event'})
                .expect(400)

            expect(response.body.success).toBe(false);
        });

        it('should reject requests with invalid names', async () => {
            const response = await request(app)
                .post('api/admin/events')
                .send({name: '', date: '2025-12-31', total_tickets: 300})
                .expect(400)

            expect(response.body.success).toBe(false);
        });

        it('should reject requests with dates in the past', async () => {
            const response = await request(app)
                .post('api/admin/events')
                .send({name: 'testevent', date: '2000-12-31', total_tickets: 300})
                .expect(400)

            expect(response.body.success).toBe(false);
        });

        it('should reject requests with non-positive ticket counts', async () => {
            const response = await request(app)
                .post('api/admin/events')
                .send({name: 'testevent', date: '2026-12-31', total_tickets: 0})
                .expect(400)

            expect(response.body.success).toBe(false);
        });

        it('should reject requests with non-positive ticket counts', async () => {
            const response = await request(app)
                .post('api/admin/events')
                .send({name: 'testevent', date: '2026-12-31', total_tickets: 300,
                    price: -1})
                .expect(400)

            expect(response.body.success).toBe(false);
        });

    });

    /** Get all events */
    describe('GET /api/admin/events', () => {

        it('should return a list of all events', async () => {
            const expected = await adminModel.getAllEvents();

            const response = await request(app)
                .get('/api/admin/events')
                .expect(200)
            
            expect(response.body.success).toBe(true);
            expect(expected.body.success).toBe(true);
            expect(response.body).toBe(expected.body);
        });

    });

    /** Get a single event by ID */
    describe('GET /api/admin/events/:id', () => {

        it('should find an event based on an input ID', async () => {
            const exEvent = await request(app)
                .post('api/admin/events')
                .send({name: 'event', date: '2025-12-31', total_tickets: 300})
                .expect(201)

            const response = await request(app)
                .get(`/api/admin/events/${exEvent}`)
                .expect(200)
        
        expect(response.body.success).toBe(true);
        });

        it('should return error 400 on invalid IDs', async () => {
            const fakeID = 999999;
            const response = await request(app)
                .get(`/api/admin/events/${fakeID}`)
                .expect(404)
            
            expect(response.body.success).toBe(false);
        });

    });

    /** Edit an existing event */
    describe('PUT /api/admin/events/:id', () => {

        it('should update an events preexisting fields', async () => {
            const example = await request(app)
                .post('api/admin/events')
                .send({name: 'event', date: '2025-12-31', total_tickets: 300})
                .expect(201)
            
            const response = await request(app)
                .put(`/api/admin/events/${example}`)
                .send({name: 'betterEvent'})
                .expect(200)

            expect(response.body.success).toBe(true);
            expect(response.body.name).toBe('betterEvent');
            

        });

        it('should reject invalid IDs', async () => {
            const fakeID = 999999;
            const response = await request(app)
                .put(`/api/admin/events/${fakeID}`)
                .send({name: 'betterEvent'})
                .expect(404)
            
            expect(response.body.success).toBe(false);
        });

    });
    /** Delete an existing event */
    describe('DELETE /api/admin/events/:id', () => {

        it('should delete an event by id', async () => {
            const example = await request(app)
                .post('api/admin/events')
                .send({name: 'event', date: '2025-12-31', total_tickets: 300})
                .expect(201)

            const response = await request(app)
                .delete(`/api/admin/events/${example}`)
                .expect(200)

            expect(response.body.success).toBe(true);
        });

        it('should reject an invalid ID', async () => {
            const fakeID = 999999;
            const response = await request(app)
                .delete(`/api/admin/events/${fakeID}`)
                .expect(404)

            expect(response.body.success).toBe(false);

        });
    });
});