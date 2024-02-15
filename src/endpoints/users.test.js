// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../app.js');

const utils = require('../utils.js');

const app = createApp();
const BASE_ENDPOINT = '/users'

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

const request = supertest(app.use(logErrors))

// TODO Could be usefull to use a test database for a real project

describe(`${BASE_ENDPOINT}`, () => {
    // ============
    // GET requests
    // ============
    describe('get requests', () => {
        let response;

        beforeEach(async () => {
            response = await request.get(BASE_ENDPOINT);
        });

        describe("get all users", () => {
            it("returns list", async () => {
                expect(Array.isArray(response.body)).toBe(true);
            });

            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });
        });

        // describe('unhappy paths', () => {
            // it('unhappy path example', () => {});
        // });
    });

    // =============
    // POST requests
    // =============
    describe('post requests', () => {
        let response;

        beforeEach(async () => {
            response = await request.post(BASE_ENDPOINT).send({
                alias: "John",
                email: "John.Doe@domain.com",
                last_name: "Doe",
                password: "secure_password",
                second_last_name: "Smith",
            });
        });

        describe("register user", () => {
            it("returns user object", async () => {
                const expectedKeys = ['id', 'alias', 'email', 
                                      'last_name', 'img',
                                      'second_last_name'];

                const allKeysIncluded = utils.checkKeysInObject(expectedKeys,
                    response.body)
                expect(allKeysIncluded).toBe(true);
            });

            it("status code of 201", async () => {
                expect(response.statusCode).toStrictEqual(201);
            });
        });

        // describe('unhappy paths', () => {
            // it('unhappy path example', () => {});
        // });
    });
});