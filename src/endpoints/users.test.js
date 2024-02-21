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

const successfulPostRequest = {
    alias: "first_test_user",
    email: "first_user@domain.com",
    last_name: "Manacle",
    password: "secure_password",
    second_last_name: "Sanches",
}

describe(`${BASE_ENDPOINT}`,  () => {
    beforeAll(async () => {
        await truncateUsersAndRelatedTables();
    });

    describe('post requests', () => {
        // =============
        // POST requests
        // =============

        describe("register user successfully", () => {
            let response;

            beforeAll(async () => {
                response = await request.post(BASE_ENDPOINT).send(successfulPostRequest);
            });

            it("returns user object", () => {
                const expectedKeys = ['id', 'alias', 'email', 
                                      'last_name', 'img',
                                      'second_last_name'];


                const allKeysIncluded = utils.checkKeysInObject(expectedKeys,
                    response.body)
                expect(allKeysIncluded).toBe(true);
                // Do NOT return user password
                expect(response.body).not.toHaveProperty('password');
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
                    ...successfulPostRequest,
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
                    ...successfulPostRequest,
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

    describe('get requests', () => {
        // ============
        // GET requests
        // ============
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
            // TODO test for 403 response
            // it('unhappy path example', () => {});
        // });
    });
});

describe(`${BASE_ENDPOINT}/{id}`,  () => {
    let response;
    let id;

    beforeAll(async () => {
        // Test's set up
        await truncateUsersAndRelatedTables();
        await request.post(BASE_ENDPOINT).send(successfulPostRequest);

        // get id of the user in db, since it changes every time the suite is run
        id = await new Promise((resolve, reject) => {
            query("SELECT id FROM users;", [], (error, results) => {
                if (error) reject(error);

                resolve(results.rows[0].id);
            }, true);
        })

        // Test response
        response = await request.get(BASE_ENDPOINT + `/${id}`);
    });

    describe('get requests', () => {
        describe('happy path', () => {
            it("status code of 200", async () => {
                expect(response.statusCode).toStrictEqual(200);
            });

            it('user object has id, alias, email, last_name, img and second_last_name properties', () => {
                const expectedKeys = ['id', 'alias', 'email', 'last_name', 'img', 'second_last_name'];
                const userObject = response.body;
                expect(utils.checkKeysInObject(expectedKeys, userObject)).toBe(true);
            });
        });

        describe('uphappy paths', () => {
            describe('400 response when', () => {
                it('userid is string', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/wrongId');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is boolean', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/true');
                    expect(response.statusCode).toStrictEqual(400);
                });

                it('userid is not positive', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/-34');
                    expect(response.statusCode).toStrictEqual(400);
                });
            });

            describe('404 response when', () => {
                it('userid is valid but user with that id does not exist', async () => {
                    const response = await request.get(BASE_ENDPOINT + '/1');
                    expect(response.statusCode).toStrictEqual(404);
                });

            });
        });
    });

    describe('put requests', () => {
        describe('happy path', () => {
            let response;
            const putBodyRequest = {
                alias: "updated alias with put",
                email: "updated_email_with_put@domain.com",
                last_name: "updated_last_name_with_put",
                password: "updated_pasword_with_put",
                second_last_name: "updated_second_last_with_put",
                img: "img",
            };

            beforeAll(async () => {
                response = await request.put(BASE_ENDPOINT + `/${id}`).send(putBodyRequest);
            });

            it('returns updated user', () => {
                const updatedUser = response.body;

                console.log(updatedUser);

                expect(updatedUser.id).toStrictEqual(id);
                expect(updatedUser.alias).toStrictEqual(putBodyRequest.alias);
                expect(updatedUser.email).toStrictEqual(putBodyRequest.email);
                expect(updatedUser.last_name).toStrictEqual(putBodyRequest.last_name);
                expect(updatedUser.second_last_name).toStrictEqual(putBodyRequest.second_last_name);
                expect(updatedUser.img).toStrictEqual(putBodyRequest.img);

                // Do NOT return user password
                expect(response.body).not.toHaveProperty('password');
            });
        });
    });
});
