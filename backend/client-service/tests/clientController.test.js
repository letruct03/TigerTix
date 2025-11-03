/** 
 * clientController.test.js - test suite for client service
 * tests admin-level input validation and basic functions
 * such as fetching, adding, removing, and editing events
 */
const request = require('supertest');
const app = require ('../server');

describe('Client Service', () => {

    /** Get all events */
    describe('GET /', () => {

        test('displays all events', async () => {
            const response = await request(app)
                .get('/')
                .expect(200)

            expect(response.body.success).toBe(true);
        });

    });

    /** Purchase a ticket */
    describe('POST /:id/purchase', () => {

        test('ticket counter deprecates', async () => {
            const response = await request(app)
                .post('/1/purchase')
                .expect(200);

            expect(response.body.success).toBe(true);
            
        });

    });

});