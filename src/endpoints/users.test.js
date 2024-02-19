// Needed to access environment variables and for server not to crash.
// if not included, then test will fail due to supertest not being able
// to read EXPRESS_SESSION_SECRET
require('dotenv').config();
const supertest = require('supertest');
const createApp = require('../app.js');

const utils = require('../utils/utils.js');
const query = require('../db/index.js').query;

// true means that it should connect to test db
const app = createApp(true);
const BASE_ENDPOINT = '/users'

function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}

const request = supertest(app.use(logErrors))

// Empty database before starting tests
const truncateUsersAndRelatedTables = async () => {
    await query("TRUNCATE users CASCADE;", [], () => {}, true);
}

describe(`${BASE_ENDPOINT}`,  () => {
    beforeAll(async () => {
        await truncateUsersAndRelatedTables();
    });

    const successfullRequest = {
        alias: "first_test_user",
        email: "first_user@domain.com",
        last_name: "Manacle",
        password: "secure_password",
        second_last_name: "Sanches",
    }

    // =============
    // POST requests
    // =============
    describe('post requests', () => {

        describe("register user successfully", () => {
            let response;

            beforeAll(async () => {
                response = await request.post(BASE_ENDPOINT).send(successfullRequest);
            });

            it("returns user object", () => {
                const expectedKeys = ['id', 'alias', 'email', 
                                      'last_name', 'img',
                                      'second_last_name'];

                console.log(response.body);
                const allKeysIncluded = utils.checkKeysInObject(expectedKeys,
                    response.body)
                expect(allKeysIncluded).toBe(true);
            });

            it("status code of 201", () => {
                expect(response.statusCode).toStrictEqual(201);
            });
        });

        describe('unhappy paths', () => {
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
                const response = await request.post(BASE_ENDPOINT).send({
                    ...successfullRequest,
                    // email same as successfulRequest
                    alias: "another_alias",
                    last_name: "another_last_name",
                    password: "another_password",
                    second_last_name: "another second last name",
                });
                expect(response.statusCode).toStrictEqual(409);
            });

            it('409 response when alias already exists in db', async () => {
                const response = await request.post(BASE_ENDPOINT).send({
                    ...successfullRequest,
                    // alias same as successfulRequest
                    email: "another_mail@domain.com",
                    last_name: "another_last_name",
                    password: "another_password",
                    second_last_name: "another second last name",
                });
                expect(response.statusCode).toStrictEqual(409);
            });
        });
    });

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
});