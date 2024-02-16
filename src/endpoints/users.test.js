// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../app.js');

const utils = require('../utils/utils.js');

const app = createApp();
const BASE_ENDPOINT = '/users'

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

const request = supertest(app.use(logErrors))

const warning = '|IMPERFECT SUITE. NEEDED A TEST TEMP DATABASE|';

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

            it('user object has id, alias, email, last_name, img and second_last_name properties', () => {
                const expectedKeys = ['id', 'alias', 'email', 'last_name', 'img', 'second_last_name'];
                const userObject = response.body[0];
                expect(utils.checkKeysInObject(expectedKeys, userObject)).toBe(true);
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
        const successfullRequest = {
            alias: "John",
            email: "John.Doe@domain.com",
            last_name: "Doe",
            password: "secure_password",
            second_last_name: "Smith",
        }

        describe("register user successfully" + warning, () => {
            let response;

            beforeAll(async () => {
                response = await request.post(BASE_ENDPOINT).send(successfullRequest);
            });

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

        describe('unhappy paths' + warning, () => {
            it('400 response when mandatory parameter is missing', async () => {
                // alias is missing
                let response = await request.post(BASE_ENDPOINT).send({
                    email: "John.Doe@domain.com",
                    last_name: "Doe",
                    password: "secure_password",
                    second_last_name: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);

                // email is missing
                response = await request.post(BASE_ENDPOINT).send({
                    alias: "John",
                    last_name: "Doe",
                    password: "secure_password",
                    second_last_name: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);

                // password is missing
                response = await request.post(BASE_ENDPOINT).send({
                    alias: "John",
                    email: "John.Doe@domain.com",
                    last_name: "Doe",
                    second_last_name: "Smith",
                })

                expect(response.statusCode).toStrictEqual(400);
            });

            it('409 response when email already exists in db', async () => {
                const response = await request.post(BASE_ENDPOINT).send(successfullRequest);
                expect(response.statusCode).toStrictEqual(409);
            });
        });
    });
});