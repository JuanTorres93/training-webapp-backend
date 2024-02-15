const request = require('supertest');

const app = require('../app.js');

const BASE_URL = "/api/products"
// TODO Could be usefull to use a test database for a real project

describe(`${BASE_URL} endpoint`, () => {
    describe('get requests', () => {
        let response;

        beforeEach(async () => {
            response = await request(app).get(BASE_URL);
        });

        describe("happy path", () => {
            it("should provide 200 status", async () => {
                expect(response.statusCode).toBe(200);
            });

            it('should provide an array of objects', () => {
                // Check if is array
                expect(Array.isArray(response.body)).toEqual(true);
                // Check if it has products in it
                expect(response.body.length).toBeGreaterThan(0);
                // Check that every product is an object
                expect(response.body.every(obj => {
                    return typeof obj === "object";
                })).toBe(true);
            });
        });

        describe('unhappy paths', () => {
            it('unhappy path example', () => {});
        });
    });
});